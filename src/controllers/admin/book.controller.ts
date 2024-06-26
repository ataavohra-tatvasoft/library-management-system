import { Request, Response, NextFunction } from 'express'
import { Book, BookGallery } from '../../db/models'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { databaseUtils, googleSheetUtils, responseHandlerUtils } from '../../utils'
import { getRatingService, getReviewService } from '../../services/book'
import { dbConfig } from '../../config'

/**
 * @description Adds a new book to the library (checks for duplicates).
 */
const addBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { bookID, name, author, charges, subscriptionDays, quantityAvailable, description }
    } = req

    const existingBook = await Book.findOne({ bookID })
    if (existingBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_ALREADY_EXISTS
      })
    }

    const newBook = await Book.create({
      bookID,
      name,
      author,
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      quantityAvailable: Number(quantityAvailable),
      charges: Number(charges),
      description
    })

    if (!newBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_CREATING_BOOK
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
 * @description Retrieves a list of active books from the library.
 */
const listBooks: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page, pageSize } = req.query

    const pageNumber = Number(page) || 1
    const limit = Number(pageSize) || 10
    const skip = (pageNumber - 1) * limit

    const totalBooksCount = await Book.countDocuments({ deletedAt: null })
    const totalPages = Math.ceil(totalBooksCount / limit)

    if (pageNumber > totalPages) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_PAGE_NUMBER
      })
    }

    const books = await Book.find(
      { deletedAt: null },
      {
        _id: 0,
        bookID: 1,
        name: 1,
        author: 1,
        numberOfFreeDays: 1,
        charges: 1,
        description: 1
      }
    )
      .skip(skip)
      .limit(limit)

    if (!books) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_LISTING_BOOK
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        books,
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
      description
    } = req.body || {}

    const existingBook = await Book.findOne({ bookID })

    if (!existingBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.BOOK_NOT_FOUND
      })
    }

    const updatedBookData = {
      ...(name && { name }),
      ...(author && { author }),
      ...(charges && { charges: Number(charges) }),
      ...(quantityAvailable && { quantityAvailable: Number(quantityAvailable) }),
      ...(subscriptionDays && { subscriptionDays: Number(subscriptionDays) }),
      ...(numberOfFreeDays && { numberOfFreeDays: Number(numberOfFreeDays) }),
      ...(description && { description })
    }

    const updatedBook = await Book.findOneAndUpdate({ bookID }, updatedBookData, { new: true })

    if (!updatedBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_BOOK
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
 * @description Temporarily removes a book from the library (soft delete).
 */
const softDeleteBook: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params

    const existingBook = await Book.findOne({ bookID, deletedAt: null })
    if (!existingBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_NOT_EXISTS
      })
    }

    const softDeletedBook = await Book.findOneAndUpdate(
      { bookID },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!softDeletedBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ERROR_DELETING_BOOK
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.BOOK_DELETED_SOFT
    })
  } catch (error) {
    return next(error)
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.BOOK_NOT_EXISTS
      })
    }

    const deletedBook = await Book.deleteOne({ bookID })
    if (!deletedBook) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ERROR_DELETING_BOOK
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.BOOK_DELETED_HARD
    })
  } catch (error) {
    return next(error)
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.BOOK_NOT_FOUND
      })
    }

    if (!req.file) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.FILE_NOT_UPLOADED
      })
    }

    const newFileName = req.file.filename

    const uploadedPhoto = await BookGallery.create({
      bookID: bookExists._id,
      imageName: newFileName,
      imagePath: req.file.path
    })

    if (!uploadedPhoto) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_UPLOAD_FILE
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.BOOK_NOT_FOUND
      })
    }

    if (!req.file) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.FILE_NOT_UPLOADED
      })
    }

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
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.BAD_REQUEST,
          message: messageConstant.ERROR_UPLOAD_FILE
        })
      }
    } else {
      const uploadedCoverPhoto = await BookGallery.create({
        bookID: bookExists._id,
        imageName: 'coverImage',
        imagePath: req.file.path
      })

      if (!uploadedCoverPhoto) {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.BAD_REQUEST,
          message: messageConstant.ERROR_UPLOAD_FILE
        })
      }
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
 * @description Gets overall ratings summary of the specific book.
 */
const getRatingsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params

    const ratingsSummary = await getRatingService.getRatings(Number(bookID))

    if (!ratingsSummary) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.NO_RATINGS_FOUND
      })
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
 * @description Gets overall reviews summary of the specific book.
 */
const getReviewsSummary: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookID } = req.params
    const { page = 1, pageSize = 10 } = req.query
    const pageNumber = Number(page)
    const limit = Number(pageSize)
    const skip = (pageNumber - 1) * limit

    const totalReviewsCount = await getReviewService.getReviewsCount(Number(bookID))
    const totalPages = Math.ceil(totalReviewsCount / limit)

    if (pageNumber > totalPages) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_PAGE_NUMBER
      })
    }

    const reviews = await getReviewService.getReviews(Number(bookID), skip, limit)

    if (!reviews || reviews.length === 0) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.NO_REVIEWS_FOUND
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        reviews: reviews.bookReviews,
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
 * @description Imports google spreadsheet data into database
 */
const importBookSpreadSheet: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sheetID } = req.params

    const data = await googleSheetUtils.fetchSheetData(String(sheetID), String('Sheet1!A2:Z'))

    const db = await dbConfig.connectToDatabase()
    if (!db) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.CONNECTION_ERROR
      })
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
            deletedAt: row[11] == String(null) ? null : new Date(row[11])
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_INSERTING_DATA
      })
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
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.MISSING_REQUIRED_PARAMETERS
      })
    }

    const db = await dbConfig.connectToDatabase()
    if (!db) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.CONNECTION_ERROR
      })
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
        'deletedAt'
      ],
      ...formattedData
    ]

    const exportStatus = await googleSheetUtils.appendDataToSheet(auth, sheetID, values)

    if (!exportStatus) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_EXPORTING_DATA
      })
    }

    const columnWidthUpdates = [
      { startIndex: 0, endIndex: 1, pixelSize: 150 },
      { startIndex: 6, endIndex: 7, pixelSize: 200 },
      { startIndex: 7, endIndex: 8, pixelSize: 130 },
      { startIndex: 8, endIndex: 9, pixelSize: 130 },
      { startIndex: 9, endIndex: 10, pixelSize: 130 },
      { startIndex: 10, endIndex: 11, pixelSize: 300 }
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
