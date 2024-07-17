import { Request, Response } from 'express'
import {
  Book,
  BookHistory,
  BookLibraryBranchMapping,
  BookRating,
  BookReview,
  LibraryBranch,
  User,
  UserLibraryBranchMapping
} from '../../db/models'
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant'
import { IBookHistory, IBookLibraryBranchMapping } from '../../interfaces'
import { helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { getRatingService, getReviewService } from '../../services/book'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces'
import { Controller } from '../../types'

/**
 * @description Searches for active books by name, ID, or both (returns details & aggregates).
 */
const searchBooks: Controller = async (req: Request, res: Response) => {
  const { name, bookID, page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
  const { branchID } = req.body

  const skip = (page - 1) * pageSize

  const searchQuery: { deletedAt: Date | null } & {
    $or?: { bookID?: string; name?: RegExp }[]
  } = {
    deletedAt: null
  }

  if (bookID || name) {
    searchQuery.$or = []
    if (bookID) searchQuery.$or.push({ bookID })
    if (name) searchQuery.$or.push({ name: new RegExp(name, 'i') })
  }

  const branch = await LibraryBranch.findOne({ branchID, deletedAt: null })
  if (!branch) {
    throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const user = await User.findOne({ _id: req.user._id, deletedAt: null }).exec()
  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const userLibraryBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: user._id,
    branchID: branch._id,
    deletedAt: null
  }).exec()

  if (!userLibraryBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const totalBooks = await Book.countDocuments(searchQuery)
  if (totalBooks === 0) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  if (page > Math.ceil(totalBooks / pageSize)) {
    throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
  }

  const searchPipeline = [
    { $match: searchQuery },
    {
      $lookup: { from: 'authors', localField: 'author', foreignField: '_id', as: 'authorDetails' }
    },
    { $unwind: '$authorDetails' },
    {
      $lookup: {
        from: 'booklibrarybranchmappings',
        localField: '_id',
        foreignField: 'bookID',
        as: 'branchMappings'
      }
    },
    {
      $match: {
        'branchMappings.libraryBranchID': branch._id,
        'branchMappings.deletedAt': null
      }
    },
    {
      $lookup: {
        from: 'librarybranches',
        localField: 'branchMappings.libraryBranchID',
        foreignField: '_id',
        as: 'libraryDetails'
      }
    },
    { $match: { 'libraryDetails.deletedAt': null } },
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
      $lookup: { from: 'bookratings', localField: '_id', foreignField: 'bookID', as: 'ratings' }
    },
    { $match: { 'ratings.deletedAt': null } },
    {
      $lookup: { from: 'bookreviews', localField: '_id', foreignField: 'bookID', as: 'reviews' }
    },
    { $match: { 'reviews.deletedAt': null } },
    {
      $addFields: {
        rating: { $avg: '$ratings.rating' },
        reviewCount: { $size: '$reviews' },
        publishYear: { $year: '$publishedDate' }
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
        publishYear: 1,
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
        page,
        pageSize,
        totalPages: Math.ceil(totalBooks / pageSize)
      }
    }
  })
}

/**
 * @description Retrieves detailed information for all active books.
 */
const getAllBookDetails: Controller = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
  const { branchID } = req.body
  const skip = (page - 1) * pageSize

  const branch = await LibraryBranch.findOne(
    { branchID, deletedAt: null },
    {
      _id: 1,
      branchID: 1,
      name: 1,
      address: 1,
      phoneNumber: 1,
      deletedAt: 1
    }
  )
  if (!branch) {
    throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const user = await User.findOne({ _id: req.user._id, deletedAt: null }).exec()
  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const userLibraryBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: user._id,
    branchID: branch._id,
    deletedAt: null
  }).exec()

  if (!userLibraryBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  const libraryBooks: IBookLibraryBranchMapping[] = await BookLibraryBranchMapping.find({
    libraryBranchID: branch._id,
    deletedAt: null
  }).exec()
  if (!libraryBooks.length) {
    throw new HttpError(messageConstant.NO_BOOKS_IN_THIS_BRANCH, httpStatusConstant.NOT_FOUND)
  }

  const bookIDs = libraryBooks.map((book) => book.bookID)

  const aggregationPipeline = [
    { $match: { _id: { $in: bookIDs }, deletedAt: null } },
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
    { $unwind: { path: '$coverImage', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        coverImageDetails: {
          _id: '$coverImage._id',
          bookID: '$coverImage.bookID',
          imagePath: '$coverImage.imagePath',
          imageName: '$coverImage.imageName',
          deletedAt: '$coverImage.deletedAt',
          createdAt: '$coverImage.createdAt',
          updatedAt: '$coverImage.updatedAt'
        }
      }
    },
    {
      $lookup: {
        from: 'authors',
        let: { authorID: '$author' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$authorID'] }]
              }
            }
          }
        ],
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
      $lookup: { from: 'bookratings', localField: '_id', foreignField: 'bookID', as: 'ratings' }
    },
    {
      $lookup: { from: 'bookreviews', localField: '_id', foreignField: 'bookID', as: 'reviews' }
    },
    {
      $addFields: {
        avgrating: { $avg: '$ratings.rating' },
        reviewCount: { $size: '$reviews' }
      }
    },
    {
      $project: {
        _id: 0,
        bookID: 1,
        name: 1,
        authorDetails: 1,
        stock: 1,
        publishedDate: 1,
        coverImageDetails: 1,
        avgrating: 1,
        reviewCount: 1
      }
    }
  ]

  const totalBooksPipeline = [...aggregationPipeline]

  const paginatedBooksPipeline = [...aggregationPipeline, { $skip: skip }, { $limit: pageSize }]

  const totalBooks = await Book.aggregate(totalBooksPipeline)
  const books = await Book.aggregate(paginatedBooksPipeline)

  if (!totalBooks.length) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: {
      books,
      libraryBranchDetails: branch,
      totalBooks: totalBooks.length
    }
  })
}

/**
 * @description Allows a user to write a review for a book (prevents duplicates).
 */
const addBookReview: Controller = async (req: Request, res: Response) => {
  const { bookID, review } = req.body

  const book = await Book.findOne({ bookID, deletedAt: null })
  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  // Check if the user is associated with a branch
  const userBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: req.user._id,
    deletedAt: null
  })
  if (!userBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  // Check if the book is available in the user's branch
  const bookBranchMapping = await BookLibraryBranchMapping.findOne({
    bookID: book._id,
    libraryBranchID: userBranchMapping.branchID,
    deletedAt: null
  })
  if (!bookBranchMapping) {
    throw new HttpError(
      messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
      httpStatusConstant.BAD_REQUEST
    )
  }

  const existingReview = await BookReview.findOne({
    userID: req.user._id,
    bookID: book._id,
    deletedAt: null
  })
  if (existingReview) {
    throw new HttpError(messageConstant.REVIEW_ALREADY_EXIST, httpStatusConstant.BAD_REQUEST)
  }

  const newReview = await BookReview.create({
    userID: req.user._id,
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
}

/**
 * @description Allows a user to rate a book (prevents duplicates).
 */
const addBookRating: Controller = async (req: Request, res: Response) => {
  const { bookID, rating } = req.body

  const book = await Book.findOne({ bookID, deletedAt: null })
  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  // Check if the user is associated with a branch
  const userBranchMapping = await UserLibraryBranchMapping.findOne({
    userID: req.user._id,
    deletedAt: null
  })
  if (!userBranchMapping) {
    throw new HttpError(messageConstant.USER_NOT_ASSIGNED_TO_BRANCH, httpStatusConstant.BAD_REQUEST)
  }

  // Check if the book is available in the user's branch
  const bookBranchMapping = await BookLibraryBranchMapping.findOne({
    bookID: book._id,
    libraryBranchID: userBranchMapping.branchID,
    deletedAt: null
  })
  if (!bookBranchMapping) {
    throw new HttpError(
      messageConstant.BOOK_NOT_AVAILABLE_IN_BRANCH,
      httpStatusConstant.BAD_REQUEST
    )
  }

  const existingRating = await BookRating.findOne({
    userID: req.user._id,
    bookID: book._id,
    deletedAt: null
  })
  if (existingRating) {
    throw new HttpError(messageConstant.RATING_ALREADY_EXIST, httpStatusConstant.BAD_REQUEST)
  }

  const newRating = await BookRating.create({
    userID: req.user._id,
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
}

/**
 * @description Retrieves detailed history of book issuance and returns (includes user info).
 */
const getBookIssueHistory: Controller = async (req: Request, res: Response) => {
  const bookHistories = (await BookHistory.find({
    userID: req.user._id,
    deletedAt: null
  }).populate([
    {
      path: 'userID',
      select: 'email firstname lastname'
    },
    {
      path: 'bookID',
      select: 'bookID name charges'
    },
    {
      path: 'issuedBy',
      select: 'firstname lastname'
    },
    {
      path: 'submittedBy',
      select: 'firstname lastname'
    }
  ])) as IBookHistory[]

  if (!bookHistories?.length) {
    throw new HttpError(messageConstant.BOOK_HISTORY_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const formattedHistories = bookHistories.map((history) => {
    const bookID = history.bookID.bookID
    const bookName = history.bookID.name
    const issuedBy = history.issuedBy.firstname + ' ' + history.issuedBy.lastname
    const submittedBy = history?.submittedBy?.firstname + ' ' + history?.submittedBy?.lastname
    const issueDate = new Date(history.issueDate)
    const submitDate = history?.submitDate ? new Date(history?.submitDate) : null
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
}

/**
 * @description Provides overall library statistics (issued, submitted, charges etc.) of a user.
 */
const getSummary: Controller = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user._id, deletedAt: null })

  const totalIssuedBooks = await BookHistory.countDocuments({
    userID: user?._id,
    deletedAt: null
  })
  const totalSubmittedBooks = await BookHistory.countDocuments({
    userID: user?._id,
    submitDate: { $exists: true, $ne: null },
    deletedAt: null
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
}

/**
 * @description Retrieves overall ratings summary of a specific book.
 */
const getBookRatingsSummary: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params

  const ratingsSummary = await getRatingService.getRatings(Number(bookID))
  if (!ratingsSummary) {
    throw new HttpError(messageConstant.NO_RATINGS_FOUND, httpStatusConstant.NOT_FOUND)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: ratingsSummary
  })
}

/**
 * @description Retrieves overall reviews summary of a specific book.
 */
const getBookReviewsSummary: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params
  const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
  const skip = (page - 1) * pageSize

  const totalReviews = await getReviewService.getReviewsCount(String(bookID))
  const totalPages = Math.ceil(totalReviews / pageSize)

  if (page > totalPages) {
    throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
  }

  const reviews = await getReviewService.getReviews(String(bookID), skip, pageSize)

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
}

/**
 * @description Gives overall report of books issued by user.
 */
const getReport: Controller = async (req: Request, res: Response) => {
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
    userID: req.user._id,
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
      path: 'userID',
      select: 'email firstname lastname'
    })
    .populate({
      path: 'bookID',
      select: 'name author paidAmount dueCharges charges description',
      populate: {
        path: 'author',
        select: 'email firstname lastname bio website address'
      }
    })
    .populate({
      path: 'issuedBy',
      select: 'firstname lastname'
    })
    .populate({
      path: 'submittedBy',
      select: 'firstname lastname'
    })
    .skip(skip)
    .limit(pageSize)

  if (!userReport.length) {
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
    bookSubmitDate: report.submitDate?.toISOString().split('T')[0] ?? null
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
