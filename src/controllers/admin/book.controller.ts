import { Request, Response, NextFunction } from 'express';
import { Book } from '../../db/models';
import { Controller } from '../../interfaces';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';

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
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
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
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_CREATING_BOOK,
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
 * @description Retrieves a list of active books from the library.
 */
const bookList: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;

        const skip = (pageNumber - 1) * limit;

        const totalBooks = await Book.countDocuments({ isActive: true }); // Get total book count
        const totalPages = Math.ceil(totalBooks / limit);

        if (pageNumber > totalPages) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        const bookData = await Book.find(
            { isActive: true },
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
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_LISTING_BOOK,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            bookData,
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
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
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

        // Update admin profile and return the updated document
        const updatedBook = await Book.findOneAndUpdate({ bookID }, updateData, { new: true });

        if (!updatedBook) {
            return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: messageConstant.ERROR_UPDATING_BOOK,
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
 * @description Temporarily removes a book from the library (soft delete).
 */
const softDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookID } = req.params;

        const bookExists = await Book.findOne({ bookID, isActive: true });
        if (!bookExists) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_NOT_EXISTS,
            });
        }

        const updatedBook = await Book.findOneAndUpdate(
            { bookID },
            { $set: { isActive: false } },
            { new: true } // Return the updated document
        );

        if (!updatedBook) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ERROR_DELETING_BOOK,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: messageConstant.BOOK_DELETED_SOFT,
        });
    } catch (error) {
        throw error;
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
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.BOOK_NOT_EXISTS,
            });
        }

        const deletedBook = await Book.deleteOne({ bookID });
        if (!deletedBook) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ERROR_DELETING_BOOK,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: messageConstant.BOOK_DELETED_HARD,
        });
    } catch (error) {
        throw error;
    }
};

export default {
    addBook,
    bookList,
    updateBook,
    softDeleteBook,
    hardDeleteBook,
};
