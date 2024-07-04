import { Request, Response, NextFunction } from 'express'
import { Book, User, BookHistory } from '../../db/models'
import { authUtils, helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces/query.interface'

/**
 * @description Retrieves a list of unique issued books with details for the librarian's branch only.
 */
const getIssuedBooksList: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const librarian = await User.findOne({ _id: verifiedToken._id })
    if (!librarian) {
      throw new HttpError(messageConstant.LIBRARIAN_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const issuedBooksAggregationPipeline = [
      {
        $match: {
          'books.issueDate': { $ne: null }
        }
      },
      { $unwind: '$books' },
      {
        $lookup: {
          from: 'books',
          localField: 'books.bookId',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      {
        $addFields: {
          book: { $arrayElemAt: ['$bookDetails', 0] },
          issueDate: '$books.issueDate'
        }
      },
      {
        $match: {
          'book.branchID': librarian.libraryBranchID
        }
      },
      {
        $lookup: {
          from: 'librarybranches',
          localField: 'book.branchID',
          foreignField: '_id',
          as: 'libraryDetails'
        }
      },
      {
        $addFields: {
          libraryDetails: {
            $map: {
              input: '$libraryDetails',
              as: 'branch',
              in: { name: '$$branch.name', address: '$$branch.address' }
            }
          }
        }
      }
    ]

    const issuedBooks = await User.aggregate(issuedBooksAggregationPipeline)
      .skip(skip)
      .limit(pageSize)

    if (!issuedBooks?.length) {
      throw new HttpError(messageConstant.NO_ISSUED_BOOK_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const total = issuedBooks.length
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
  } catch (error) {
    next(error)
  }
}

/**
 * @description Issues a book to a user after validating availability and limits, restricted to librarian's branch.
 */
const issueBookToUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const { bookID, email, issueDate } = req.body

    const librarian = await User.findOne({ _id: verifiedToken._id })
    if (!librarian) {
      throw new HttpError(messageConstant.LIBRARIAN_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const book = await Book.findOne({ bookID, branchID: librarian.libraryBranchID })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const user = await User.findOne({ email }).populate('books')
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (user.books) {
      for (const issuedBook of user.books) {
        if (String(issuedBook.bookId) === String(book._id)) {
          throw new HttpError(
            messageConstant.CANNOT_ISSUE_SAME_BOOK,
            httpStatusConstant.BAD_REQUEST
          )
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
      { email },
      {
        $push: {
          books: {
            bookId: book._id,
            ...(issueDate && { issueDate: new Date(issueDate) })
          }
        }
      }
    )

    if (!userUpdate) {
      throw new HttpError(messageConstant.ERROR_ASSIGNING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    const bookUpdate = await Book.updateOne(
      { _id: book._id },
      {
        $inc: { quantityAvailable: -1, issueCount: +1 },
        numberOfFreeDays: numberOfFreeDays
      }
    )

    if (!bookUpdate.modifiedCount) {
      throw new HttpError(messageConstant.ERROR_UPDATING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    const logHistory = await BookHistory.create({
      bookID: book._id,
      userID: user._id,
      issuedBy: verifiedToken._id, // Assuming verifiedToken includes _id of the librarian
      issueDate: new Date(issueDate)
    })

    if (!logHistory) {
      throw new HttpError(messageConstant.ERROR_LOGGING_HISTORY, httpStatusConstant.BAD_REQUEST)
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
 * @description Processes book return, calculates charges, and updates user records.
 */
const submitBookForUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)
    const { bookID, email, submitDate } = req.body

    const librarian = await User.findOne({ _id: verifiedToken._id })
    if (!librarian) {
      throw new HttpError(messageConstant.LIBRARIAN_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const [book, user] = await Promise.all([
      Book.findOne({ bookID, branchID: librarian.libraryBranchID }),
      User.findOne({ email })
    ])

    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const submitDateObject = new Date(submitDate)

    if (!user.books) {
      throw new HttpError(messageConstant.NO_ISSUED_BOOKS_FOUND, httpStatusConstant.NOT_FOUND)
    }
    const issuedBook = user.books.find(
      (issuedBookEntry) =>
        String(issuedBookEntry.bookId) === String(book._id) &&
        issuedBookEntry.issueDate <= submitDateObject
    )

    if (!issuedBook) {
      throw new HttpError(messageConstant.BOOK_NOT_ISSUED, httpStatusConstant.BAD_REQUEST)
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
      const userUpdateStatus = await User.updateOne({ email }, { $inc: { dueCharges: dueCharges } })
      if (!userUpdateStatus.modifiedCount) {
        throw new HttpError(
          messageConstant.ERROR_UPDATING_DUE_CHARGES_IN_USER,
          httpStatusConstant.BAD_REQUEST
        )
      }
    } else {
      console.log('Due charges are already 0 for user:', user.firstname + ' ' + user.lastname)
    }

    const deletedBook = await User.findOneAndUpdate(
      { email, 'books.bookId': book._id },
      {
        $pull: { books: { bookId: book._id } }
      },
      { new: true }
    )

    if (!deletedBook) {
      throw new HttpError(messageConstant.ERROR_DELETING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    const bookUpdateStatus = await Book.updateOne(
      { _id: book._id },
      {
        $inc: { quantityAvailable: 1, submitCount: +1 }
      }
    )

    if (!bookUpdateStatus.modifiedCount) {
      throw new HttpError(messageConstant.ERROR_UPDATING_BOOK, httpStatusConstant.BAD_REQUEST)
    }

    const logHistory = await BookHistory.updateOne(
      {
        bookID: book._id,
        userID: user._id,
        submitDate: null
      },
      {
        submittedBy: verifiedToken?._id,
        submitDate: new Date(submitDate)
      }
    )

    if (!logHistory) {
      throw new HttpError(messageConstant.ERROR_LOGGING_HISTORY, httpStatusConstant.BAD_REQUEST)
    }

    const totalCharge = await User.findOne({ email }, { _id: 0, dueCharges: 1 })

    const message = `Due charges: Rs. ${totalCharge?.dueCharges || 0}. Kindly pay after submission of the book.`

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: { note: message },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getIssuedBooksList,
  issueBookToUser,
  submitBookForUser
}
