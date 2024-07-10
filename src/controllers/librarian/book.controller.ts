import { Request, Response, NextFunction } from 'express'
import { Author, Book, BookLibraryBranchMapping, LibraryBranch, User } from '../../db/models'
import { Controller } from '../../types'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces'
import { responseHandlerUtils } from '../../utils'

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

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (existingBook) {
      throw new HttpError(messageConstant.BOOK_ALREADY_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    let author = await Author.findOne({ email: authorEmail, deletedAt: null })
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
      charges: Number(charges),
      issueCount: 0,
      submitCount: 0,
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      quantityAvailable: Number(quantityAvailable),
      ...(description && { description }),
      deletedAt: null
    })

    if (!newBook) {
      throw new HttpError(messageConstant.ERROR_CREATING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    const bookLibraryBranchMapping = await BookLibraryBranchMapping.create({
      bookID: newBook._id,
      libraryBranchID: branchExists._id
    })

    if (!bookLibraryBranchMapping) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_BOOK_LIBRARY_BRANCH_MAPPING,
        httpStatusConstant.BAD_REQUEST
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
 * @description Retrieves a list of active books from the library.
 */
const listBooks: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
    if (!librarian || !librarian.libraryBranchID) {
      throw new HttpError(
        messageConstant.USER_NOT_ASSIGNED_TO_BRANCH,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const branchID = librarian.libraryBranchID

    const totalBooksCount = await BookLibraryBranchMapping.countDocuments({
      libraryBranchID: branchID,
      deletedAt: null
    })
    if (!totalBooksCount) {
      throw new HttpError(messageConstant.NO_BOOKS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const totalPages = Math.ceil(totalBooksCount / pageSize)

    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const books = await BookLibraryBranchMapping.find(
      { libraryBranchID: branchID, deletedAt: null },
      {
        _id: 0,
        bookID: 1
      }
    )
      .populate({
        path: 'bookID',
        select: 'name author subscriptionDays charges description',
        populate: {
          path: 'author',
          select: 'firstname lastname email bio website address'
        }
      })
      .skip(skip)
      .limit(pageSize)

    if (!books?.length) {
      throw new HttpError(messageConstant.NO_BOOKS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        books: books.map((b) => b.bookID), // To only return book details
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
      description
    } = req.body

    let author

    const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
    if (!librarian || !librarian.libraryBranchID) {
      throw new HttpError(
        messageConstant.USER_NOT_ASSIGNED_TO_BRANCH,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const branchID = librarian.libraryBranchID

    const bookBranchMapping = await BookLibraryBranchMapping.findOne({
      bookID,
      libraryBranchID: branchID,
      deletedAt: null
    })
    if (!bookBranchMapping) {
      throw new HttpError(
        messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
        httpStatusConstant.NOT_FOUND
      )
    }

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (!existingBook) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (authorEmail) {
      author = await Author.findOne({ email: authorEmail, deletedAt: null })
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
          { email: authorEmail, deletedAt: null },
          {
            firstname: authorFirstName,
            lastname: authorLastName,
            bio: authorBio,
            website: authorWebsite,
            address: authorAddress
          }
        )
      }
    }

    const updatedBookData = {
      ...(name && { name }),
      ...(authorEmail && { author: author?._id }),
      ...(charges && { charges: Number(charges) }),
      ...(quantityAvailable && { quantityAvailable: Number(quantityAvailable) }),
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      ...(numberOfFreeDays && { numberOfFreeDays: Number(numberOfFreeDays) }),
      ...(description && { description })
    }

    const updatedBook = await Book.findOneAndUpdate({ bookID, deletedAt: null }, updatedBookData, {
      new: true
    })
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

    const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
    if (!librarian || !librarian.libraryBranchID) {
      throw new HttpError(
        messageConstant.USER_NOT_ASSIGNED_TO_BRANCH,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const branchID = librarian.libraryBranchID

    const bookBranchMapping = await BookLibraryBranchMapping.findOne({
      bookID,
      libraryBranchID: branchID,
      deletedAt: null
    })
    if (!bookBranchMapping) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (!existingBook || existingBook.deletedAt) {
      throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const softDeletedBook = await BookLibraryBranchMapping.findByIdAndUpdate(
      bookID,
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!softDeletedBook) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_BOOK,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
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

    const librarian = await User.findOne({ _id: req.user._id })
    if (!librarian || !librarian.libraryBranchID) {
      throw new HttpError(
        messageConstant.USER_NOT_ASSIGNED_TO_BRANCH,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const branchID = librarian.libraryBranchID

    const bookBranchMapping = await BookLibraryBranchMapping.findOne({
      bookID,
      libraryBranchID: branchID
    })
    if (!bookBranchMapping) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (!existingBook) {
      throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const deletedBook = await BookLibraryBranchMapping.findByIdAndDelete(bookID)
    if (!deletedBook) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_BOOK,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
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
