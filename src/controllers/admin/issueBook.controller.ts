import { Request, Response, NextFunction } from 'express';
import { Book, User } from '../../db/models';
import { helperFunctionsUtils, loggerUtils } from '../../utils';
import { Controller } from '../../interfaces';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { BookHistory } from '../../db/models/bookHistory.model';

/**
 * @description Retrieves a list of unique issued books with details.
 */
const issueBookList: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;

        const skip = (pageNumber - 1) * limit;

        const issuedBooksAggregation = [
            {
                $match: {
                    books: { $elemMatch: { issueDate: { $ne: null } } }, // Filter users with issued books
                },
            },
            {
                $unwind: '$books', // Deconstruct books array for distinct operation
            },
            {
                $lookup: {
                    from: 'books', // Join with Book collection
                    localField: 'books.bookId',
                    foreignField: '_id',

                    as: 'bookDetails',
                },
            },
            {
                $project: {
                    _id: 0, // Exclude user document ID
                    book: {
                        $first: '$bookDetails', // Get first book document (avoids duplicates)
                    },
                    issueDate: 1, // Include issueDate for each unique book
                },
            },
            {
                $group: {
                    _id: { bookId: '$book._id', issueDate: '$issueDate' }, // Group by unique book ID and issueDate combination
                },
            },
            {
                $lookup: {
                    from: 'books', // Join with Book collection again
                    localField: '_id.bookId', // Use grouped bookId for lookup
                    foreignField: '_id',
                    as: 'bookDetails',
                },
            },
            {
                $unwind: '$bookDetails', // Unwind book details for each group
            },
            {
                $project: {
                    _id: 0, // Exclude group ID
                    book: '$bookDetails', // Include book details
                    issueDate: '$_id.issueDate', // Include issueDate from the group
                },
            },
        ];

        const books = await User.aggregate(issuedBooksAggregation).skip(skip).limit(limit);

        if (!books) {
            return res.status(httpStatusConstant.OK).json({
                status: true,
                message: messageConstant.NO_ISSUED_BOOK_FOUND,
            });
        }

        if (!books.length) {
            return res.status(httpStatusConstant.OK).json({
                status: true,
                message: messageConstant.NO_ISSUED_BOOK_FOUND,
            });
        }

        const total = books.length;

        const totalPages = Math.ceil(total / limit);

        if (pageNumber > totalPages) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            issuedBooks: books,
            pagination: {
                page: pageNumber,
                pageSize: limit,
                totalPages,
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Issues a book to a user after validating availability and limits.
 */
const issueBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID, email, issueDate } = req.body;

        const [book, user] = await Promise.all([
            Book.findOne({ bookID }),
            User.findOne({ email }).populate('books'),
        ]);

        if (!book) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }
        if (!user) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        for (const redundantBook of user.books) {
            if (String(redundantBook.bookId) == String(book._id)) {
                return res.status(httpStatusConstant.BAD_REQUEST).json({
                    status: false,
                    message: messageConstant.CANNOT_ISSUE_SAME_BOOK,
                });
            }
        }

        if (book.quantityAvailable <= 0) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_OUT_OF_STOCK,
            });
        }

        if (user.books.length >= 5) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_LIMIT_EXCEEDED,
            });
        }

        if (user.dueCharges && Number(user.dueCharges) > 500) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.OUTSTANDING_DUE_CHARGES,
            });
        }

        if (issueDate && new Date(issueDate) < new Date()) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ISSUE_DATE_INVALID,
            });
        }

        const freeDays = helperFunctionsUtils.numberOfFreeDays(issueDate, book.quantityAvailable);

        const userUpdate = await User.findOneAndUpdate(
            { email },
            {
                $push: {
                    books: {
                        bookId: book._id,
                        ...(issueDate && { issueDate: new Date(issueDate) }),
                    },
                },
            }
        );

        if (!userUpdate) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_ASSIGNING_BOOK,
            });
        }

        const bookUpdate = await Book.updateOne(
            { _id: book._id },
            {
                $inc: { quantityAvailable: -1, issueCount: +1 },
                numberOfFreeDays: freeDays,
                isActive: true,
            }
        );

        if (!bookUpdate.modifiedCount) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_UPDATING_BOOK,
            });
        }

        const logHistory = await BookHistory.create({
            bookID: book._id,
            userID: user._id,
            issueDate: new Date(issueDate),
        });

        if (!logHistory) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_LOGGING_HISTORY,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Processes book return, calculates charges, and updates user records.
 */
const submitBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
        const { bookID, email, submitDate } = req.body;

        const [book, user] = await Promise.all([Book.findOne({ bookID }), User.findOne({ email })]);

        if (!book) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        } else if (!user) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const submitDateObject = new Date(submitDate);

        const issuedBook = user.books.find(
            (issuedBookEntry) =>
                String(issuedBookEntry.bookId) == String(book._id) &&
                issuedBookEntry.issueDate <= submitDateObject
        );

        if (!issuedBook) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_NOT_ISSUED,
            });
        }

        const durationInDays = Math.ceil(
            (submitDateObject.getTime() - issuedBook.issueDate.getTime()) / DAY_IN_MILLISECONDS
        );

        const dueCharges = durationInDays * book.charges;

        if (dueCharges > 0) {
            const userUpdateStatus = await User.updateOne(
                { email },
                { $inc: { dueCharges: dueCharges } }
            );
            if (!userUpdateStatus.modifiedCount) {
                return res.status(httpStatusConstant.BAD_REQUEST).json({
                    status: false,
                    message: messageConstant.ERROR_UPDATING_USER,
                });
            }
        } else {
            console.log(
                'Due charges are already 0 for user:',
                user.firstname + ' ' + user.lastname
            );
        }

        const deletedBook = await User.findOneAndUpdate(
            { email, 'books.bookId': book._id }, // Filter by email and bookId
            {
                $pull: {
                    books: { bookId: book._id }, // Remove only the first matching book
                },
            },
            { new: true } // Return updated user document (optional)
        );

        if (!deletedBook) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        const bookUpdateStatus = await Book.updateOne(
            { _id: book._id },
            {
                $inc: { quantityAvailable: 1, submitCount: +1 },
            }
        );

        if (!bookUpdateStatus.modifiedCount) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_UPDATING_BOOK,
            });
        }

        const logHistory = await BookHistory.updateOne(
            {
                bookID: book._id,
                userID: user._id,
                submitDate: null,
            },
            {
                submitDate: new Date(submitDate),
            }
        );

        if (!logHistory) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_LOGGING_HISTORY,
            });
        }

        const totalCharge = await User.findOne({ email }, { _id: 0, dueCharges: 1 });

        const message = `Due charges: Rs. ${totalCharge?.dueCharges || 0}. Kindly pay after submission of the book.`;
        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
            note: message,
        });
    } catch (error) {
        throw error;
    }
};

export default {
    issueBookList,
    issueBook,
    submitBook,
};
