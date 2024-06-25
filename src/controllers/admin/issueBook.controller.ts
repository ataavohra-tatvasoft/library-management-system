import { Request, Response, NextFunction } from 'express'
import { Book, User } from '../../db/models'
import { helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { BookHistory } from '../../db/models/bookHistory.model'

/**
 * @description Retrieves a list of unique issued books with details.
 */
const issueBookList: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page, pageSize } = req.query

    const pageNumber = Number(page) || 1
    const limit = Number(pageSize) || 10
    const skip = (pageNumber - 1) * limit

    const issuedBooksAggregation = [
      {
        $match: {
          books: { $elemMatch: { issueDate: { $ne: null } } }
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
        $project: {
          _id: 0,
          book: { $first: '$bookDetails' },
          issueDate: 1
        }
      },
      {
        $group: {
          _id: { bookId: '$book._id', issueDate: '$issueDate' }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id.bookId',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      { $unwind: '$bookDetails' },
      {
        $project: {
          _id: 0,
          book: '$bookDetails',
          issueDate: '$_id.issueDate'
        }
      }
    ]

    const books = await User.aggregate(issuedBooksAggregation).skip(skip).limit(limit)
    if (!books || books.length === 0) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.OK,
        message: messageConstant.NO_ISSUED_BOOK_FOUND
      })
    }

    const totalBooks = await User.aggregate(issuedBooksAggregation)
    const total = totalBooks.length
    const totalPages = Math.ceil(total / limit)

    if (pageNumber > totalPages) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_PAGE_NUMBER
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        issuedBooks: books,
        pagination: {
          page: pageNumber,
          pageSize: limit,
          totalPages
        }
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Issues a book to a user after validating availability and limits.
 */
const issueBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID, email, issueDate } = req.body

    const [book, user] = await Promise.all([
      Book.findOne({ bookID }),
      User.findOne({ email }).populate('books.bookId')
    ])

    if (!book) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.BOOK_NOT_FOUND
      })
    }
    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    for (const redundantBook of user.books) {
      if (String(redundantBook.bookId) === String(book._id)) {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.BAD_REQUEST,
          message: messageConstant.CANNOT_ISSUE_SAME_BOOK
        })
      }
    }

    if (book.quantityAvailable <= 0) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_OUT_OF_STOCK
      })
    }

    if (user.books.length >= 5) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_LIMIT_EXCEEDED
      })
    }

    if (user.dueCharges && Number(user.dueCharges) > 500) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.OUTSTANDING_DUE_CHARGES
      })
    }

    if (issueDate) {
      const providedIssueDate = new Date(issueDate)
      const currentDate = new Date()

      currentDate.setHours(0, 0, 0, 0)
      providedIssueDate.setHours(0, 0, 0, 0)

      if (providedIssueDate.getTime() < currentDate.getTime()) {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.BAD_REQUEST,
          message: messageConstant.ISSUE_DATE_INVALID
        })
      }
    }

    const freeDays = helperFunctionsUtils.numberOfFreeDays(issueDate, book.quantityAvailable)

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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_ASSIGNING_BOOK
      })
    }

    const bookUpdate = await Book.updateOne(
      { _id: book._id },
      {
        $inc: { quantityAvailable: -1, issueCount: +1 },
        numberOfFreeDays: freeDays
      }
    )

    if (!bookUpdate.modifiedCount) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_UPDATING_BOOK
      })
    }

    const logHistory = await BookHistory.create({
      bookID: book._id,
      userID: user._id,
      issueDate: new Date(issueDate)
    })

    if (!logHistory) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_LOGGING_HISTORY
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Processes book return, calculates charges, and updates user records.
 */
const submitBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24
    const { bookID, email, submitDate } = req.body

    const [book, user] = await Promise.all([Book.findOne({ bookID }), User.findOne({ email })])

    if (!book) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_NOT_FOUND
      })
    }
    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    const submitDateObject = new Date(submitDate)

    const issuedBook = user.books.find(
      (issuedBookEntry) =>
        String(issuedBookEntry.bookId) === String(book._id) &&
        issuedBookEntry.issueDate <= submitDateObject
    )

    if (!issuedBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_NOT_ISSUED
      })
    }

    const submitDateCheck = user.books.find(
      (issuedBookEntry) =>
        String(issuedBookEntry.bookId) === String(book._id) &&
        issuedBookEntry.issueDate <= submitDateObject
    )

    if (!submitDateCheck) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_SUBMIT_DATE
      })
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
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.BAD_REQUEST,
          message: messageConstant.ERROR_UPDATING_DUE_CHARGES_IN_USER
        })
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_DELETING_BOOK
      })
    }

    const bookUpdateStatus = await Book.updateOne(
      { _id: book._id },
      {
        $inc: { quantityAvailable: 1, submitCount: +1 }
      }
    )

    if (!bookUpdateStatus.modifiedCount) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_UPDATING_BOOK
      })
    }

    const logHistory = await BookHistory.updateOne(
      {
        bookID: book._id,
        userID: user._id,
        submitDate: null
      },
      {
        submitDate: new Date(submitDate)
      }
    )

    if (!logHistory) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_LOGGING_HISTORY
      })
    }

    const totalCharge = await User.findOne({ email }, { _id: 0, dueCharges: 1 })

    const message = `Due charges: Rs. ${totalCharge?.dueCharges || 0}. Kindly pay after submission of the book.`

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: { note: message },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

export default {
  issueBookList,
  issueBook,
  submitBook
}
