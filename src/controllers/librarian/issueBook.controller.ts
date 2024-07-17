import { Request, Response } from 'express'
import {
  Book,
  User,
  BookHistory,
  BookLibraryBranchMapping,
  UserLibraryBranchMapping,
  LibraryBranch
} from '../../db/models'
import { helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { Controller } from '../../types'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces'

/**
 * @description Retrieves a list of unique issued books with details including branch name and branch ID.
 */
const getIssuedBooksList: Controller = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
  const skip = (page - 1) * pageSize

  const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
  if (!librarian || !librarian.libraryBranchID) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const branchID = librarian.libraryBranchID

  const basePipeline = [
    { $match: { 'books.issueDate': { $ne: null }, 'books.branchID': branchID } },
    { $unwind: '$books' },
    {
      $lookup: {
        from: 'books',
        localField: 'books.bookId',
        foreignField: '_id',
        as: 'booksInfo'
      }
    },
    { $unwind: '$booksInfo' },
    {
      $addFields: {
        bookDetails: {
          _id: '$booksInfo._id',
          bookID: '$booksInfo.bookID',
          name: '$booksInfo.name',
          author: '$booksInfo.author',
          charges: '$booksInfo.charges',
          issueCount: '$booksInfo.issueCount',
          submitCount: '$booksInfo.submitCount',
          publishedDate: '$booksInfo.publishedDate',
          subscriptionDays: '$booksInfo.subscriptionDays',
          quantityAvailable: '$booksInfo.quantityAvailable',
          numberOfFreeDays: '$booksInfo.numberOfFreeDays',
          description: '$booksInfo.description',
          deletedAt: '$booksInfo.deletedAt',
          createdAt: '$booksInfo.createdAt',
          updatedAt: '$booksInfo.updatedAt'
        }
      }
    },
    {
      $lookup: {
        from: 'authors',
        let: { authorID: '$booksInfo.author' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$authorID'] } } }],
        as: 'authors'
      }
    },
    { $unwind: { path: '$authors', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        authorDetails: {
          email: '$authors.email',
          firstname: '$authors.firstname',
          lastname: '$authors.lastname',
          bio: '$authors.bio',
          website: '$authors.website',
          address: '$authors.address'
        }
      }
    },
    {
      $lookup: {
        from: 'librarybranches',
        localField: 'books.branchID',
        foreignField: '_id',
        as: 'branchDetails'
      }
    },
    { $unwind: '$branchDetails' },
    {
      $project: {
        bookDetails: 1,
        authorDetails: 1,
        issueDate: '$books.issueDate',
        branchID: '$branchDetails._id',
        branchName: '$branchDetails.name'
      }
    }
  ]

  const issuedBooks = await User.aggregate([...basePipeline])
    .skip(skip)
    .limit(pageSize)

  if (!issuedBooks.length) {
    throw new HttpError(messageConstant.NO_ISSUED_BOOK_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const totalIssuedBooks = await User.aggregate([...basePipeline])
  const total = totalIssuedBooks.length
  const totalPages = Math.ceil(total / pageSize)

  if (page > totalPages) {
    throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: {
      issuedBooks,
      pagination: {
        page,
        pageSize,
        totalPages
      }
    },
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Issues a book to a user after validating availability and limits.
 */
const issueBookToUser: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params
  const { email, issueDate, branchID } = req.body

  const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
  if (!librarian || !librarian.libraryBranchID) {
    throw new HttpError(messageConstant.LIBRARIAN_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

  const book = await Book.findOne({ bookID, deletedAt: null }).populate('author').exec()
  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const user = await User.findOne({ email, deletedAt: null }).populate('libraryBranchID').exec()
  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const libraryBranch = await LibraryBranch.findOne({
    branchID: branchID,
    deletedAt: null
  })
  if (!libraryBranch) {
    throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  if (String(librarian.libraryBranchID) !== String(libraryBranch._id)) {
    throw new HttpError(messageConstant.INVALID_LIBRARIAN, httpStatusConstant.ACCESS_FORBIDDEN)
  }

  const userLibraryBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: user._id,
    branchID: libraryBranch._id,
    deletedAt: null
  }).exec()

  if (!userLibraryBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const matchingBookBranch = await BookLibraryBranchMapping.findOne({
    bookID: book._id,
    libraryBranchID: libraryBranch._id,
    deletedAt: null
  }).exec()

  if (!matchingBookBranch) {
    throw new HttpError(
      messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
      httpStatusConstant.BAD_REQUEST
    )
  }

  if (user.books && user.books.length > 0) {
    for (const issuedBook of user.books) {
      if (String(issuedBook.bookId) === String(book._id)) {
        throw new HttpError(messageConstant.CANNOT_ISSUE_SAME_BOOK, httpStatusConstant.BAD_REQUEST)
      }
    }

    if (user.books.length >= 5) {
      throw new HttpError(messageConstant.BOOK_LIMIT_EXCEEDED, httpStatusConstant.BAD_REQUEST)
    }
  }

  if (book.quantityAvailable <= 0) {
    throw new HttpError(messageConstant.BOOK_OUT_OF_STOCK, httpStatusConstant.BAD_REQUEST)
  }

  if (user.dueCharges && Number(user.dueCharges) > 500) {
    throw new HttpError(messageConstant.OUTSTANDING_DUE_CHARGES, httpStatusConstant.BAD_REQUEST)
  }

  if (issueDate) {
    const providedIssueDate = new Date(issueDate)
    const currentDate = new Date()

    currentDate.setHours(0, 0, 0, 0)
    providedIssueDate.setHours(0, 0, 0, 0)

    if (providedIssueDate.getTime() < currentDate.getTime()) {
      throw new HttpError(messageConstant.ISSUE_DATE_INVALID, httpStatusConstant.BAD_REQUEST)
    }
  }

  const numberOfFreeDays = helperFunctionsUtils.calculateNumberOfFreeDays(
    issueDate,
    book.quantityAvailable
  )

  const userUpdate = await User.findOneAndUpdate(
    { email, deletedAt: null },
    {
      $push: {
        books: {
          bookId: book._id,
          branchID: libraryBranch._id,
          ...(issueDate && { issueDate: new Date(issueDate) })
        }
      }
    },
    { new: true }
  ).exec()

  if (!userUpdate) {
    throw new HttpError(messageConstant.ERROR_ASSIGNING_BOOK, httpStatusConstant.BAD_REQUEST)
  }

  const bookUpdate = await Book.findOneAndUpdate(
    { _id: book._id, deletedAt: null },
    {
      $inc: { quantityAvailable: -1, issueCount: 1 },
      numberOfFreeDays: numberOfFreeDays
    },
    { new: true }
  ).exec()

  if (!bookUpdate) {
    throw new HttpError(messageConstant.ERROR_UPDATING_BOOK, httpStatusConstant.BAD_REQUEST)
  }

  const logHistory = await BookHistory.create({
    bookID: book._id,
    userID: user._id,
    issuedBy: req.user._id,
    issueDate: issueDate ? new Date(issueDate) : undefined
  })

  if (!logHistory) {
    throw new HttpError(messageConstant.ERROR_LOGGING_HISTORY, httpStatusConstant.BAD_REQUEST)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Processes book return, calculates charges, and updates user records.
 */
const submitBookForUser: Controller = async (req: Request, res: Response) => {
  const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24
  const { bookID } = req.params
  const { email, submitDate, branchID } = req.body

  const librarian = await User.findOne({ _id: req.user._id, deletedAt: null })
  if (!librarian || !librarian.libraryBranchID) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const book = await Book.findOne({ bookID, deletedAt: null }).exec()
  const user = await User.findOne({ email, deletedAt: null }).populate('libraryBranchID').exec()
  const branch = await LibraryBranch.findOne({ branchID, deletedAt: null })

  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

  if (!branch) {
    throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  if (String(librarian.libraryBranchID) !== String(branch._id)) {
    throw new HttpError(
      messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
      httpStatusConstant.ACCESS_FORBIDDEN
    )
  }

  const userLibraryBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: user._id,
    branchID: branch._id,
    deletedAt: null
  }).exec()

  if (!userLibraryBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const matchingBookBranch = await BookLibraryBranchMapping.findOne({
    bookID: book._id,
    libraryBranchID: branch._id,
    deletedAt: null
  }).exec()

  if (!matchingBookBranch) {
    throw new HttpError(
      messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
      httpStatusConstant.BAD_REQUEST
    )
  }

  const submitDateObject = new Date(submitDate)

  const issuedBook = user.books?.find(
    (issuedBookEntry) =>
      String(issuedBookEntry.bookId) === String(book._id) &&
      issuedBookEntry.issueDate <= submitDateObject &&
      String(issuedBookEntry.branchID) === String(branch._id)
  )

  if (!issuedBook) {
    throw new HttpError(
      messageConstant.BOOK_NOT_ISSUED + ' or ' + messageConstant.SUBMIT_DATE_INVALID,
      httpStatusConstant.BAD_REQUEST
    )
  }

  const subscriptionEndDate = new Date(
    issuedBook.issueDate.getTime() + book.subscriptionDays * DAY_IN_MILLISECONDS
  )
  const durationInDays = Math.max(
    0,
    Math.ceil((submitDateObject.getTime() - subscriptionEndDate.getTime()) / DAY_IN_MILLISECONDS)
  )

  const dueCharges = durationInDays * book.charges

  if (dueCharges > 0) {
    await User.updateOne({ email }, { $inc: { dueCharges: dueCharges } }).exec()
  } else {
    console.log('Due charges are already 0 for user:', user.firstname + ' ' + user.lastname)
  }

  const userUpdate = await User.findOneAndUpdate(
    { email, deletedAt: null },
    {
      $pull: {
        books: { bookId: book._id, branchID: branch._id }
      },
      $inc: {
        dueCharges: dueCharges
      }
    },
    { new: true }
  ).exec()

  if (!userUpdate) {
    throw new HttpError(messageConstant.ERROR_UPDATING_USER, httpStatusConstant.BAD_REQUEST)
  }

  await Book.updateOne({ _id: book._id }, { $inc: { quantityAvailable: 1, submitCount: 1 } }).exec()

  const logHistory = await BookHistory.updateOne(
    {
      bookID: book._id,
      userID: user._id,
      submitDate: null
    },
    {
      submittedBy: req.user._id,
      submitDate: submitDate ? new Date(submitDate) : undefined
    }
  ).exec()

  if (!logHistory) {
    throw new HttpError(messageConstant.ERROR_LOGGING_HISTORY, httpStatusConstant.BAD_REQUEST)
  }

  const totalCharge = await User.findOne(
    { email, deletedAt: null },
    { _id: 0, dueCharges: 1 }
  ).exec()

  const message = `Due charges: Rs. ${totalCharge?.dueCharges || 0}. Kindly pay after submission of the book.`

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: { note: message },
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

export default {
  getIssuedBooksList,
  issueBookToUser,
  submitBookForUser
}
