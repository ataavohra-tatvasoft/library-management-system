import { Request, Response, NextFunction } from 'express'
import { Book, BookHistory, BookRating, BookReview, User } from '../../db/models'
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant'
import { Controller, IBookHistory } from '../../interfaces'
import { authUtils, helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { getRatingService, getReviewService } from '../../services/book'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces/query.interface'

/**
 * @description Searches for active books by name, ID, or both (returns details & aggregates).
 */
const searchBooks: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, bookID, page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const searchQuery: { deletedAt: Date | null } & {
      $or?: { bookID?: string; name?: RegExp }[]
    } = {
      deletedAt: null
    }

    if (bookID || name) {
      searchQuery.$or = []
      if (bookID) searchQuery.$or.push({ bookID: bookID })
      if (name) searchQuery.$or.push({ name: new RegExp(name, 'i') })
    }

    const totalBooks = await Book.countDocuments({ deletedAt: null })
    if (!totalBooks) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (page > Math.ceil(totalBooks / pageSize)) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const searchPipeline = [
      { $match: searchQuery },
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      { $unwind: '$authorDetails' },
      {
        $lookup: {
          from: 'bookgalleries',
          let: { bookID: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$bookID', '$$bookID'] }, { $eq: ['$imageName', 'coverImage'] }]
                }
              }
            }
          ],
          as: 'coverImage'
        }
      },
      {
        $lookup: {
          from: 'bookratings',
          localField: '_id',
          foreignField: 'bookID',
          as: 'ratings'
        }
      },
      {
        $lookup: {
          from: 'bookreviews',
          localField: '_id',
          foreignField: 'bookID',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          rating: { $avg: '$ratings.rating' },
          reviewCount: { $size: '$reviews' },
          publishYear: { $year: '$publishedDate' }
        }
      },
      {
        $lookup: {
          from: 'librarybranches',
          localField: 'branchID',
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
      },
      {
        $project: {
          bookID: 1,
          name: 1,
          author: {
            email: '$authorDetails.email',
            firstname: '$authorDetails.firstname',
            lastname: '$authorDetails.lastname',
            bio: '$authorDetails.bio',
            website: '$authorDetails.website',
            address: '$authorDetails.address'
          },
          stock: '$quantityAvailable',
          rating: { $ifNull: ['$rating', 0] },
          reviewCount: 1,
          publishYear: { $year: '$publishedDate' },
          coverImage: 1,
          branchID: 1,
          libraryDetails: 1
        }
      },
      { $skip: skip },
      { $limit: pageSize }
    ]

    const searchedBooks = await Book.aggregate(searchPipeline)
    if (!searchedBooks?.length) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        searchedBooks,
        pagination: {
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(totalBooks / pageSize)
        }
      }
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Retrieves detailed information for all active books.
 */
const getAllBookDetails: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const totalBooks = await Book.countDocuments({ deletedAt: null })
    if (!totalBooks) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (page > Math.ceil(totalBooks / pageSize)) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const searchPipeline = [
      { $match: { deletedAt: null } },
      {
        $lookup: {
          from: 'bookgalleries',
          let: { bookID: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$bookID', '$$bookID'] }, { $eq: ['$imageName', 'coverImage'] }]
                }
              }
            }
          ],
          as: 'coverImage'
        }
      },
      {
        $lookup: {
          from: 'bookratings',
          localField: '_id',
          foreignField: 'bookID',
          as: 'ratings'
        }
      },
      {
        $lookup: {
          from: 'bookreviews',
          localField: '_id',
          foreignField: 'bookID',
          as: 'reviews'
        }
      },
      {
        $lookup: {
          from: 'bookgalleries',
          localField: '_id',
          foreignField: 'bookID',
          as: 'gallery'
        }
      },
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      { $unwind: '$authorDetails' },
      {
        $addFields: {
          rating: { $avg: '$ratings.rating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $project: {
          _id: 0,
          bookID: 1,
          name: 1,
          author: {
            email: '$authorDetails.email',
            firstname: '$authorDetails.firstname',
            lastname: '$authorDetails.lastname',
            bio: '$authorDetails.bio',
            website: '$authorDetails.website',
            address: '$authorDetails.address'
          },
          stock: '$quantityAvailable',
          publishedDate: 1,
          coverImage: 1,
          gallery: 1,
          rating: 1,
          reviews: 1,
          reviewCount: 1,
          branchID: 1
        }
      },
      {
        $lookup: {
          from: 'librarybranches',
          localField: 'branchID',
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
              in: {
                name: '$$branch.name',
                address: '$$branch.address',
                phoneNumber: '$$branch.phoneNumber'
              }
            }
          }
        }
      }
    ]

    const books = await Book.aggregate(searchPipeline).skip(skip).limit(pageSize)
    if (!books.length) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        books,
        totalBooks
      }
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Allows a user to write a review for a book (prevents duplicates).
 */
const addBookReview: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const { bookID, review } = req.body

    const book = await Book.findOne({ bookID })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingReview = await BookReview.findOne({ userID: verifiedToken._id, bookID: book._id })
    if (existingReview) {
      throw new HttpError(messageConstant.REVIEW_ALREADY_EXIST, httpStatusConstant.BAD_REQUEST)
    }

    const newReview = await BookReview.create({
      userID: verifiedToken._id,
      bookID: book._id,
      review
    })
    if (!newReview) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_BOOK_REVIEW,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
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
 * @description Allows a user to rate a book (prevents duplicates).
 */
const addBookRating: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)
    const { bookID, rating } = req.body

    const book = await Book.findOne({ bookID })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const existingRating = await BookRating.findOne({ userID: verifiedToken._id, bookID: book._id })
    if (existingRating) {
      throw new HttpError(messageConstant.RATING_ALREADY_EXIST, httpStatusConstant.BAD_REQUEST)
    }

    const newRating = await BookRating.create({
      userID: verifiedToken._id,
      bookID: book._id,
      rating
    })
    if (!newRating) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_BOOK_RATING,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
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
 * @description Retrieves detailed history of book issuance and returns (includes user info).
 */
const getBookIssueHistory: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const bookHistories = (await BookHistory.find({ userID: verifiedToken?._id }).populate({
      path: 'userID bookID issuedBy submittedBy',
      select: 'email firstname lastname bookID name charges firstname lastname firstname lastname'
    })) as unknown as IBookHistory[]

    if (!bookHistories?.length) {
      throw new HttpError(messageConstant.BOOK_HISTORY_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const formattedHistories = bookHistories.map((history) => {
      const bookID = history.bookID.bookID
      const bookName = history.bookID.name
      const issuedBy = history.issuedBy.firstname + ' ' + history.issuedBy.lastname
      const submittedBy = history.submittedBy.firstname + ' ' + history.submittedBy.lastname
      const issueDate = new Date(history.issueDate)
      const submitDate = history.submitDate ? new Date(history.submitDate) : null
      const usedDays = submitDate
        ? Math.ceil((submitDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const totalAmount = submitDate ? (usedDays || 0) * history.bookID.charges : null

      return {
        bookID,
        bookName,
        issuedBy,
        submittedBy,
        issueDate,
        submitDate,
        usedDays,
        totalAmount
      }
    })

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        bookHistories: formattedHistories
      }
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Provides overall library statistics (issued, submitted, charges etc.) of a user.
 */
const getSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const user = await User.findById({ _id: verifiedToken._id })

    const totalIssuedBooks = await BookHistory.countDocuments({ userID: user?._id })
    const totalSubmittedBooks = await BookHistory.countDocuments({
      userID: user?._id,
      submitDate: { $exists: true, $ne: null }
    })

    if (totalIssuedBooks === undefined || totalSubmittedBooks === undefined) {
      throw new HttpError(
        messageConstant.ERROR_COUNTING_BOOK_HISTORY,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const totalNotSubmittedBooks = totalIssuedBooks - totalSubmittedBooks

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        totalIssuedBooks,
        totalSubmittedBooks,
        totalNotSubmittedBooks,
        totalPaidAmount: user?.paidAmount,
        totalDueCharges: user?.dueCharges
      }
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Retrieves overall ratings summary of a specific book.
 */
const getBookRatingsSummary: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookID } = req.params

    const ratingsSummary = await getRatingService.getRatings(Number(bookID))
    if (!ratingsSummary) {
      throw new HttpError(messageConstant.NO_RATINGS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: ratingsSummary
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Retrieves overall reviews summary of a specific book.
 */
const getBookReviewsSummary: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookID } = req.params
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const totalReviews = await getReviewService.getReviewsCount(Number(bookID))
    const totalPages = Math.ceil(totalReviews / pageSize)

    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const reviews = await getReviewService.getReviews(Number(bookID), skip, pageSize)

    if (!reviews?.length) {
      throw new HttpError(messageConstant.NO_REVIEWS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        reviews: reviews.bookReviews,
        pagination: {
          page: page,
          pageSize: pageSize,
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
 * @description Gives overall report of books issued by user.
 */
const getReport: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      startDate,
      endDate,
      monthYear
    } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize
    let start: Date | undefined
    let end: Date | undefined

    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    await helperFunctionsUtils.validateDateRange(
      startDate ? startDate : undefined,
      endDate ? endDate : undefined,
      monthYear ? monthYear : undefined
    )

    if (monthYear) {
      const [month, year] = monthYear.split('-')
      start = new Date(Number(year), Number(month) - 1, 1)
      end = new Date(Number(year), Number(month), 0)
    } else if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    }

    const filter: any = {
      userID: verifiedToken._id,
      deletedAt: null
    }

    if (start) {
      filter.issueDate = { $gte: start }
    }
    if (end) {
      filter.submitDate = { $lte: end }
    }

    const total = await BookHistory.countDocuments(filter)
    if (!total) {
      throw new HttpError(messageConstant.BOOK_HISTORY_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const totalPages = Math.ceil(total / pageSize)

    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const userReport = await BookHistory.find(filter)
      .populate({
        path: 'userID bookID issuedBy submittedBy',
        select:
          'email firstname lastname paidAmount dueCharges name author charges description firstname lastname firstname lastname',
        populate: {
          path: 'author',
          model: 'authors',
          select: 'email firstname lastname bio website address'
        }
      })
      .skip(skip)
      .limit(pageSize)

    if (!userReport) {
      throw new HttpError(messageConstant.BOOK_HISTORY_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const formattedReport = userReport.map((report: any) => ({
      userDetail: {
        email: report.userID.email,
        firstname: report.userID.firstname,
        lastname: report.userID.lastname
      },
      bookDetail: {
        name: report.bookID.name,
        author: {
          email: report.bookID.author.email,
          firstname: report.bookID.author.firstname,
          lastname: report.bookID.author.lastname,
          bio: report.bookID.author.bio,
          website: report.bookID.author.website,
          address: report.bookID.author.address
        },
        paidAmount: report.bookID.paidAmount,
        dueCharges: report.bookID.dueCharges,
        charges: report.bookID.charges,
        description: report.bookID.description
      },
      issuedBy: report.issuedBy.firstname + ' ' + report.issuedBy.lastname,
      submittedBy: report.submittedBy.firstname + ' ' + report.submittedBy.lastname,
      bookIssueDate: report.issueDate.toISOString().split('T')[0],
      bookSubmitDate: report.submitDate.toISOString().split('T')[0]
    }))

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        userDetail: formattedReport[0]?.userDetail,
        bookReports: formattedReport.map(({ bookDetail, bookIssueDate, bookSubmitDate }) => ({
          bookDetail,
          bookIssueDate,
          bookSubmitDate
        })),
        pagination: {
          page: page,
          pageSize: pageSize,
          totalPages
        }
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

export default {
  searchBooks,
  getAllBookDetails,
  addBookReview,
  addBookRating,
  getBookIssueHistory,
  getSummary,
  getBookRatingsSummary,
  getBookReviewsSummary,
  getReport
}
