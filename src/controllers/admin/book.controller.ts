import { Request, Response, NextFunction } from 'express';
import { Book, BookGallery } from '../../db/models';
import { Controller } from '../../interfaces';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { responseHandlerUtils } from '../../utils';
import { getRatingService, getReviewService } from '../../services/book';

/**
 * @description Adds a new book to the library (checks for duplicates).
 */
const addBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            body: {
                bookID,
                name,
                author,
                charges,
                subscriptionDays,
                quantityAvailable,
                description,
            },
        } = req;

        const existingBook = await Book.findOne({ bookID });
        if (existingBook) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.BOOK_ALREADY_EXISTS,
            });
        }

        const newBook = await Book.create({
            bookID,
            name,
            author,
            ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
            quantityAvailable: Number(quantityAvailable),
            charges: Number(charges),
            description,
        });

        if (!newBook) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.ERROR_CREATING_BOOK,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Retrieves a list of active books from the library.
 */
const bookList: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;
        const skip = (pageNumber - 1) * limit;

        const totalBooks = await Book.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalBooks / limit);

        if (pageNumber > totalPages) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        const bookData = await Book.find(
            { isDeleted: false },
            {
                _id: 0,
                bookID: 1,
                name: 1,
                author: 1,
                numberOfFreeDays: 1,
                charges: 1,
                description: 1,
            }
        )
            .skip(skip)
            .limit(limit);

        if (!bookData) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.ERROR_LISTING_BOOK,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            data: {
                bookData,
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

/**
 * @description Updates an existing book in the library.
 */
const updateBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;
        const {
            name,
            author,
            charges,
            subscriptionDays,
            quantityAvailable,
            numberOfFreeDays,
            description,
        } = req.body || {};

        const bookExists = await Book.findOne({ bookID });

        if (!bookExists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        const updateData = {
            ...(name && { name }),
            ...(author && { author }),
            ...(charges && { charges: Number(charges) }),
            ...(quantityAvailable && { quantityAvailable: Number(quantityAvailable) }),
            ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
            ...(numberOfFreeDays && { numberOfFreeDays: Number(numberOfFreeDays) }),
            ...(description && { description }),
        };

        const updatedBook = await Book.findOneAndUpdate({ bookID }, updateData, { new: true });

        if (!updatedBook) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
                message: messageConstant.ERROR_UPDATING_BOOK,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Temporarily removes a book from the library (soft delete).
 */
const softDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;

        const bookExists = await Book.findOne({ bookID, isDeleted: false });
        if (!bookExists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.BOOK_NOT_EXISTS,
            });
        }

        const updatedBook = await Book.findOneAndUpdate(
            { bookID },
            { $set: { isDeleted: true, deletedAt: Date.now() } },
            { new: true }
        );

        if (!updatedBook) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.ERROR_DELETING_BOOK,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: messageConstant.BOOK_DELETED_SOFT,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Permanently deletes a book from the library.
 */
const hardDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;

        const bookExists = await Book.findOne({ bookID });
        if (!bookExists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.BOOK_NOT_EXISTS,
            });
        }

        const deletedBook = await Book.deleteOne({ bookID });
        if (!deletedBook) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.ERROR_DELETING_BOOK,
            });
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: messageConstant.BOOK_DELETED_HARD,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Uploads book's display photos.
 */
const uploadBookPhoto: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;

        const exists = await Book.findOne({ bookID });
        if (!exists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.FILE_NOT_UPLOADED,
            });
        }

        // File path and name are already unique due to multer configuration
        const newFileName = req.file.filename;

        // Create record for uploaded file
        const uploadFile = await BookGallery.create({
            bookID: exists._id,
            imageName: newFileName,
            imagePath: req.file.path,
        });

        // Check if file was successfully uploaded
        if (!uploadFile) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.ERROR_UPLOAD_FILE,
            });
        }

        // Return success response
        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Uploads book's cover photo.
 */
const uploadBookCoverPhoto: Controller = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { bookID } = req.params;

        const exists = await Book.findOne({ bookID });
        if (!exists) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.NOT_FOUND,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return responseHandlerUtils.responseHandler(res, {
                statusCode: httpStatusConstant.BAD_REQUEST,
                message: messageConstant.FILE_NOT_UPLOADED,
            });
        }

        // Since the filename is structured uniquely by multer, we use 'coverImage' convention for the record
        const existingFile = await BookGallery.findOne({
            bookID: exists._id,
            imageName: 'coverImage',
        });

        if (existingFile) {
            const updateCoverImage = await BookGallery.updateOne(
                {
                    bookID: exists._id,
                    imageName: 'coverImage',
                },
                {
                    imagePath: req.file.path,
                }
            );

            if (!updateCoverImage) {
                return responseHandlerUtils.responseHandler(res, {
                    statusCode: httpStatusConstant.BAD_REQUEST,
                    message: messageConstant.ERROR_UPLOAD_FILE,
                });
            }
        } else {
            const uploadFile = await BookGallery.create({
                bookID: exists._id,
                imageName: 'coverImage',
                imagePath: req.file.path,
            });

            if (!uploadFile) {
                return responseHandlerUtils.responseHandler(res, {
                    statusCode: httpStatusConstant.BAD_REQUEST,
                    message: messageConstant.ERROR_UPLOAD_FILE,
                });
            }
        }

        return responseHandlerUtils.responseHandler(res, {
            statusCode: httpStatusConstant.OK,
            message: httpErrorMessageConstant.SUCCESSFUL,
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
    addBook,
    bookList,
    updateBook,
    softDeleteBook,
    hardDeleteBook,
    uploadBookPhoto,
    uploadBookCoverPhoto,
    ratingsSummary,
    reviewsSummary,
};
