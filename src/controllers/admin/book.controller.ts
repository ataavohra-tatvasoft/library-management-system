import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { Book, BookGallery, LibraryBranch } from '../../db/models'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import {
  databaseUtils,
  googleSheetUtils,
  multerConfigUtils,
  responseHandlerUtils
} from '../../utils'
import { getRatingService, getReviewService } from '../../services/book'
import { dbConfig } from '../../config'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces/query.interface'

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
        author,
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

    const newBook = await Book.create({
      bookID,
      name,
      author,
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      quantityAvailable: Number(quantityAvailable),
      charges: Number(charges),
      ...(description && { description: description }),
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
      author,
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

    const updatedBookData = {
      ...(name && { name }),
      ...(author && { author }),
      ...(charges && { charges: Number(charges) }),
      ...(quantityAvailable && { quantityAvailable: Number(quantityAvailable) }),
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      ...(numberOfFreeDays && { numberOfFreeDays: Number(numberOfFreeDays) }),
      ...(description && { description }),
      ...(branchName && { branchName: branchExists._id })
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

/**
 * @description Uploads book's display photos.
 */
const uploadBookPhoto: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params

    const bookExists = await Book.findOne({ bookID })
    if (!bookExists) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (!req.file) {
      throw new HttpError(messageConstant.FILE_NOT_UPLOADED, httpStatusConstant.BAD_REQUEST)
    }

    multerConfigUtils.upload.single('bookPhoto')

    const newFileName = req.file.filename

    const uploadedPhoto = await BookGallery.create({
      bookID: bookExists._id,
      imageName: newFileName,
      imagePath: req.file.path
    })

    if (!uploadedPhoto) {
      throw new HttpError(messageConstant.ERROR_UPLOAD_FILE, httpStatusConstant.BAD_REQUEST)
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
 * @description Uploads book's cover photo.
 */
const uploadBookCoverPhoto: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookID } = req.params

    const bookExists = await Book.findOne({ bookID })
    if (!bookExists) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (!req.file) {
      throw new HttpError(messageConstant.FILE_NOT_UPLOADED, httpStatusConstant.BAD_REQUEST)
    }

    multerConfigUtils.upload.single('bookCoverPhoto')

    const existingCoverPhoto = await BookGallery.findOne({
      bookID: bookExists._id,
      imageName: 'coverImage'
    })

    if (existingCoverPhoto) {
      const updatedCoverPhoto = await BookGallery.updateOne(
        {
          bookID: bookExists._id,
          imageName: 'coverImage'
        },
        {
          imagePath: req.file.path
        }
      )

      if (!updatedCoverPhoto) {
        throw new HttpError(messageConstant.ERROR_UPLOAD_FILE, httpStatusConstant.BAD_REQUEST)
      }
    } else {
      const uploadedCoverPhoto = await BookGallery.create({
        bookID: bookExists._id,
        imageName: 'coverImage',
        imagePath: req.file.path
      })

      if (!uploadedCoverPhoto) {
        throw new HttpError(messageConstant.ERROR_UPLOAD_FILE, httpStatusConstant.BAD_REQUEST)
      }
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
 * @description Gets overall ratings summary of the specific book.
 */
const getRatingsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
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
    next(error)
  }
}

/**
 * @description Gets overall reviews summary of the specific book.
 */
const getReviewsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery

    const reviewsSummary = await getReviewService.getReviews(Number(bookID), page, pageSize)
    if (!reviewsSummary) {
      throw new HttpError(messageConstant.NO_REVIEWS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: reviewsSummary
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Imports google spreadsheet data into database
 */
const importBookSpreadSheet: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sheetID } = req.params

    const data = await googleSheetUtils.fetchSheetData(sheetID, String('Sheet1!A2:Z'))
    if (!data) {
      throw new HttpError(messageConstant.NO_DATA_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const db = await dbConfig.connectToDatabase()
    if (!db) {
      throw new HttpError(
        messageConstant.CONNECTION_ERROR,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const collection = await databaseUtils.connectToCollection(db.connection, 'books')

    const formattedData = data
      .map((row: any) => {
        try {
          return {
            bookID: row[0],
            name: row[1],
            author: row[2],
            charges: Number(row[3]),
            issueCount: Number(row[4]),
            submitCount: Number(row[5]),
            publishedDate: new Date(row[6]),
            subscriptionDays: Number(row[7]),
            quantityAvailable: Number(row[8]),
            numberOfFreeDays: Number(row[9]),
            description: row[10],
            branchID: new ObjectId(String(row[11])),
            deletedAt: row[12] == String(null) ? null : new Date(row[11])
          }
        } catch (error) {
          console.error('Error formatting data row:', error)
        }
      })
      .filter(Boolean)

    const insertionStatus = await collection.insertMany(formattedData)
    if (insertionStatus) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.CREATED,
        message: messageConstant.DATA_ADDED_SUCCESSFULLY
      })
    } else {
      throw new HttpError(
        messageConstant.ERROR_INSERTING_DATA,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Exports database collection into google spreadsheets
 */
const exportDataToSpreadsheet: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sheetID } = req.params

    if (!sheetID) {
      throw new HttpError(
        messageConstant.MISSING_REQUIRED_PARAMETERS,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const db = await dbConfig.connectToDatabase()
    if (!db) {
      throw new HttpError(
        messageConstant.CONNECTION_ERROR,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const data = await databaseUtils.fetchCollectionData(db.connection, 'books')

    const formattedData = data.map((row: any) => [
      row.bookID,
      row.name,
      row.author,
      row.charges,
      row.issueCount,
      row.submitCount,
      row.publishedDate,
      row.subscriptionDays,
      row.quantityAvailable,
      row.numberOfFreeDays,
      row.description,
      row.branchID,
      row.deletedAt
    ])

    const auth = await googleSheetUtils.authorize()

    const values = [
      [
        'bookID',
        'name',
        'author',
        'charges',
        'issueCount',
        'submitCount',
        'publishedDate',
        'subscriptionDays',
        'quantityAvailable',
        'numberOfFreeDays',
        'description',
        'branchID',
        'deletedAt'
      ],
      ...formattedData
    ]

    const exportStatus = await googleSheetUtils.appendDataToSheet(auth, sheetID, values)
    if (!exportStatus) {
      throw new HttpError(
        messageConstant.ERROR_EXPORTING_DATA,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const columnWidthUpdates = [
      { startIndex: 0, endIndex: 1, pixelSize: 150 },
      { startIndex: 6, endIndex: 7, pixelSize: 200 },
      { startIndex: 7, endIndex: 8, pixelSize: 130 },
      { startIndex: 8, endIndex: 9, pixelSize: 130 },
      { startIndex: 9, endIndex: 10, pixelSize: 130 },
      { startIndex: 10, endIndex: 11, pixelSize: 200 },
      { startIndex: 11, endIndex: 12, pixelSize: 300 }
    ]

    await googleSheetUtils.updateColumnWidths(auth, sheetID, columnWidthUpdates)

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.DATA_EXPORTED_SUCCESSFULLY
    })
  } catch (error) {
    return next(error)
  }
}

export default {
  addBook,
  listBooks,
  updateBook,
  softDeleteBook,
  hardDeleteBook,
  uploadBookPhoto,
  uploadBookCoverPhoto,
  getRatingsSummary,
  getReviewsSummary,
  importBookSpreadSheet,
  exportDataToSpreadsheet
}
