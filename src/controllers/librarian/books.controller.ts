import { Request, Response, NextFunction } from 'express'
import { Author, Book, LibraryBranch } from '../../db/models'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces/query.interface'
import { responseHandlerUtils } from '../../utils'

//On Hold: All controllers are on hold for further modification

/**
 * @description Adds a new book to the library (checks for duplicates).
 */
const addBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: {
        branchName,
        bookID,
        name,
        authorEmail,
        authorFirstName,
        authorLastName,
        authorBio,
        authorWebsite,
        authorAddress,
        charges,
        subscriptionDays,
        quantityAvailable,
        description
      }
    } = req

    const branchExists = await LibraryBranch.findOne({ name: branchName, deletedAt: null })
    if (!branchExists) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingBook = await Book.findOne({ bookID })
    if (existingBook) {
      throw new HttpError(messageConstant.BOOK_ALREADY_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    let author = await Author.findOne({ email: authorEmail })
    if (!author) {
      author = await Author.create({
        email: authorEmail,
        firstname: authorFirstName,
        lastname: authorLastName,
        bio: authorBio,
        website: authorWebsite,
        address: authorAddress
      })
    }

    const newBook = await Book.create({
      bookID,
      name,
      author: author._id,
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      quantityAvailable: Number(quantityAvailable),
      charges: Number(charges),
      ...(description && { description }),
      branchID: branchExists._id
    })
    if (!newBook) {
      throw new HttpError(messageConstant.ERROR_CREATING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Retrieves a list of active books from the library.
 */
const listBooks: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const totalBooksCount = await Book.countDocuments({ deletedAt: null })
    if (!totalBooksCount) {
      throw new HttpError(messageConstant.NO_BOOKS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const totalPages = Math.ceil(totalBooksCount / pageSize)

    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const books = await Book.find(
      { deletedAt: null },
      {
        _id: 0,
        bookID: 1,
        name: 1,
        author: 1,
        subscriptionDays: 1,
        charges: 1,
        description: 1
      }
    )
      .populate({ path: 'branchID', select: 'name address' })
      .populate({ path: 'author', select: 'firstname lastname email bio website address' }) // Populating author details
      .skip(skip)
      .limit(pageSize)

    if (!books?.length) {
      throw new HttpError(messageConstant.NO_BOOKS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        books,
        pagination: {
          page: page,
          pageSize: pageSize,
          totalPages
        }
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Updates an existing book in the library.
 */
const updateBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params
    const {
      name,
      authorEmail,
      authorFirstName,
      authorLastName,
      authorBio,
      authorWebsite,
      authorAddress,
      charges,
      subscriptionDays,
      quantityAvailable,
      numberOfFreeDays,
      description,
      branchName
    } = req.body

    const branchExists = await LibraryBranch.findOne({ name: branchName, deletedAt: null })
    if (!branchExists) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingBook = await Book.findOne({ bookID })
    if (!existingBook) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    let author = await Author.findOne({ email: authorEmail })
    if (!author) {
      author = await Author.create({
        email: authorEmail,
        firstname: authorFirstName,
        lastname: authorLastName,
        bio: authorBio,
        website: authorWebsite,
        address: authorAddress
      })
    } else {
      // Update author information if it exists
      await Author.updateOne(
        { email: authorEmail },
        {
          firstname: authorFirstName,
          lastname: authorLastName,
          bio: authorBio,
          website: authorWebsite,
          address: authorAddress
        }
      )
    }

    const updatedBookData = {
      ...(name && { name }),
      author: author._id,
      ...(charges && { charges: Number(charges) }),
      ...(quantityAvailable && { quantityAvailable: Number(quantityAvailable) }),
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      ...(numberOfFreeDays && { numberOfFreeDays: Number(numberOfFreeDays) }),
      ...(description && { description }),
      branchID: branchExists._id
    }

    const updatedBook = await Book.findOneAndUpdate({ bookID }, updatedBookData, { new: true })
    if (!updatedBook) {
      throw new HttpError(
        messageConstant.ERROR_UPDATING_BOOK,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Temporarily removes a book from the library (soft delete).
 */
const softDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (!existingBook) {
      throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const softDeletedBook = await Book.findOneAndUpdate(
      { bookID },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!softDeletedBook) {
      throw new HttpError(messageConstant.ERROR_DELETING_BOOK, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.BOOK_DELETED_SOFT
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Permanently deletes a book from the library.
 */
const hardDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params

    const existingBook = await Book.findOne({ bookID })
    if (!existingBook) {
      throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const deletedBook = await Book.deleteOne({ bookID })
    if (!deletedBook) {
      throw new HttpError(messageConstant.ERROR_DELETING_BOOK, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.BOOK_DELETED_HARD
    })
  } catch (error) {
    next(error)
  }
}

export default {
  addBook,
  listBooks,
  updateBook,
  softDeleteBook,
  hardDeleteBook
}
