import { Request, Response, NextFunction } from 'express';
import { Book, BookHistory, BookRating, BookReview, User } from '../../db/models';
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant';
import { Controller } from '../../interfaces';
import { responseHandlerUtils } from '../../utils';
import { getRatingService, getReviewService } from '../../services/book';

/**
 * @description Searches for active books by name, ID, or both (returns details & aggregates).
 */
const searchBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, bookID, page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;
        const skip = (pageNumber - 1) * limit;

        const searchQuery: { isDeleted: boolean } & { $or?: { bookID?: String; name?: RegExp }[] } =
            {
                isDeleted: false,
            };

        if (bookID || name) {
            searchQuery.$or = [];
            if (bookID) searchQuery.$or.push({ bookID: String(bookID) });
            if (name) searchQuery.$or.push({ name: new RegExp(name as string, 'i') });
        }

        const totalBooks = await Book.countDocuments({ isDeleted: false });

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
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Searches for active books and returns it's every detail.
 */
const bookDetails: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalBooks = await Book.countDocuments({ isDeleted: false });

        const searchPipeline = [
            { $match: { isDeleted: false } },
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
                $lookup: {
                    from: 'bookgalleries',
                    localField: '_id',
                    foreignField: 'bookID',
                    as: 'gallery',
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
                    stock: '$quantityAvailable',
                    publishedDate: 1,
                    coverImage: 1,
                    gallery: 1,
                    rating: 1,
                    reviews: 1,
                    reviewCount: 1,
                },
            },
        ];

        const books = await Book.aggregate(searchPipeline);

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
    } catch (error) {
        return next(error);
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
    } catch (error) {
        return next(error);
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
    } catch (error) {
        return next(error);
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

        const bookHistories = await BookHistory.find({ userID: user._id }).populate({
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

            const totalAmount = submitDate ? (usedDays || 0) * history.bookID.charges : null;

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
    } catch (error) {
        return next(error);
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
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Gets overall ratings summary of the specific book.
 */
const ratingsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;

        const ratingsSummary = await getRatingService.getRatings(Number(bookID));

        if (!ratingsSummary) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.NO_RATINGS_FOUND,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: ratingsSummary,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Gets overall reviews summary of the specific book.
 */
const reviewsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;
        const { page = 1, pageSize = 10 } = req.query;
        const pageNumber = Number(page);
        const limit = Number(pageSize);
        const skip = (pageNumber - 1) * limit;

        const totalReviews = await getReviewService.getReviewsCount(Number(bookID));
        const totalPages = Math.ceil(totalReviews / limit);

        if (pageNumber > totalPages) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        const reviews = await getReviewService.getReviews(Number(bookID), skip, limit);

        if (!reviews || reviews.length === 0) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.NO_REVIEWS_FOUND,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                reviews: reviews.bookReviews,
                pagination: {
                    page: pageNumber,
                    pageSize: limit,
                    totalPages,
                },
            },
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    searchBook,
    bookDetails,
    addReview,
    addRating,
    issueBookHistory,
    summaryAPI,
    ratingsSummary,
    reviewsSummary,
};
