import { Request, Response, NextFunction } from 'express';
import { Book, BookHistory, BookRating, BookReview, User } from '../../db/models';
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant';
import { Controller } from '../../interfaces';
import { loggerUtils, responseHandlerUtils } from '../../utils';

/**
 * @description Searches for active books by name, ID, or both (returns details & aggregates).
 */
const searchBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, bookID, page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;
        const skip = (pageNumber - 1) * limit;

        const searchQuery: { isActive: boolean } & { $or?: { bookID?: String; name?: RegExp }[] } =
            {
                isActive: true,
            };

        if (bookID || name) {
            searchQuery.$or = [];
            if (bookID) searchQuery.$or.push({ bookID: String(bookID) });
            if (name) searchQuery.$or.push({ name: new RegExp(name as string, 'i') });
        }

        const totalBooks = await Book.countDocuments(searchQuery);

        if (pageNumber > Math.ceil(totalBooks / limit)) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        const searchPipeline = [
            { $match: searchQuery },
            {
                $lookup: {
                    from: 'bookgalleries',
                    let: { bookID: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$bookID', '$$bookID'] },
                                        { $eq: ['$imageName', 'coverImage'] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'coverImage',
                },
            },
            {
                $lookup: {
                    from: 'bookratings',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'ratings',
                },
            },
            {
                $lookup: {
                    from: 'bookreviews',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'reviews',
                },
            },
            {
                $addFields: {
                    rating: { $avg: '$ratings.rating' },
                    reviewCount: { $size: '$reviews' },
                    publishYear: { $year: '$publishedDate' },
                },
            },
            {
                $project: {
                    bookID: 1,
                    name: 1,
                    author: 1,
                    stock: '$quantityAvailable',
                    rating: { $ifNull: ['$rating', 0] },
                    reviewCount: 1,
                    publishYear: 1,
                    coverImage: 1,
                },
            },
            { $skip: skip },
            { $limit: limit },
        ];

        const searchedBooks = await Book.aggregate(searchPipeline);

        if (!searchedBooks.length) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                searchedBooks,
                pagination: {
                    page: pageNumber,
                    pageSize: limit,
                    totalPages: Math.ceil(totalBooks / limit),
                },
            },
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

/**yet to be completed */
const bookDetails: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalBooks = await Book.countDocuments({ isActive: true });

        const bookDetails = [
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'bookgalleries',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'gallery',
                },
            },
            {
                $unwind: '$gallery',
            },
            {
                $addFields: {
                    isCoverImage: { $eq: ['$gallery.imageName', 'coverImage'] },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    bookID: { $first: '$bookID' },
                    coverImage: {
                        $first: {
                            $cond: { if: '$isCoverImage', then: '$$ROOT.gallery', else: null },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'bookratings',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'ratings',
                },
            },
            {
                $lookup: {
                    from: 'bookreviews',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'reviews',
                },
            },
            {
                $addFields: {
                    rating: { $avg: '$ratings.rating' },
                    reviewCount: { $size: '$reviews' },
                },
            },
            {
                $project: {
                    _id: 0,
                    bookID: 1,
                    name: 1,
                    author: 1,
                    image: 1,
                    gallery: 1,
                    stock: '$quantityAvailable',
                    rating: 1,
                    reviewCount: 1,
                    reviews: 1,
                    publishedDate: 1,
                },
            },
        ];

        const books = await Book.aggregate(bookDetails);

        if (!books.length) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                books,
                totalBooks,
            },
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

/**
 * @description Lets a user write a review for a book (prevents duplicates).
 */
const addReview: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        const { bookID, review } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const book = await Book.findOne({ bookID });
        if (!book) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        const existingReview = await BookReview.findOne({ userID: user._id, bookID: book._id });

        if (existingReview) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.REVIEW_ALREADY_EXIST,
            });
        }

        await BookReview.create({ userID: user._id, bookID: book._id, review });

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

/**
 * @description Allows a user to rate a book (prevents duplicates).
 */
const addRating: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        const { bookID, rating } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const book = await Book.findOne({ bookID });
        if (!book) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        const existingRating = await BookRating.findOne({ userID: user._id, bookID: book._id });

        if (existingRating) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.RATING_ALREADY_EXIST,
            });
        }

        await BookRating.create({ userID: user._id, bookID: book._id, rating });

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

/**
 * @description Retrieves detailed history of book issuance and returns (includes user info).
 */
const issueBookHistory: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const bookHistories: any = await BookHistory.find({ userID: user._id }).populate({
            path: 'userID bookID',
            select: 'email firstname lastname bookID name charges',
        });

        if (!bookHistories || bookHistories.length === 0) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_HISTORY_NOT_FOUND,
            });
        }

        const formattedHistories = bookHistories.map((history: any) => {
            const issueDate = new Date(history.issueDate);
            const submitDate = history.submitDate ? new Date(history.submitDate) : null;
            const usedDays = submitDate
                ? Math.ceil((submitDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
                : null;

            const totalAmount = submitDate ? (usedDays || 1) * history.bookID.charges : null;

            return {
                issueDate,
                submitDate,
                usedDays,
                totalAmount,
            };
        });

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                bookHistories: formattedHistories,
            },
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

/**
 * @description Provides overall library statistics (issued, submitted, charges etc.).
 */
const summaryAPI: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email }, { _id: 1, paidAmount: 1, dueCharges: 1 });
        if (!user) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const totalIssuedBooks = await BookHistory.countDocuments({ userID: user._id });
        const totalSubmittedBooks = await BookHistory.countDocuments({
            userID: user._id,
            submitDate: { $exists: true, $ne: null },
        });
        const totalNotSubmittedBooks = totalIssuedBooks - totalSubmittedBooks;

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                totalIssuedBooks,
                totalSubmittedBooks,
                totalNotSubmittedBooks,
                totalPaidAmount: user.paidAmount,
                totalDueCharges: user.dueCharges,
            },
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
            error,
        });
    }
};

export default {
    searchBook,
    bookDetails,
    addReview,
    addRating,
    issueBookHistory,
    summaryAPI,
};
