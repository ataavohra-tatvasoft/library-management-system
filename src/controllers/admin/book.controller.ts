import { Request, Response } from 'express'
import { Author, Book, BookGallery } from '../../db/models'
import { Controller } from '../../types'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { databaseUtils, googleSheetUtils, responseHandlerUtils } from '../../utils'
import { getRatingService, getReviewService } from '../../services/book'
import { dbConfig } from '../../config'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces'
import { ObjectId } from 'mongodb'

/**
 * @description Adds a new book to the library (checks for duplicates).
 */
const addBook: Controller = async (req: Request, res: Response) => {
  const {
    body: {
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

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Retrieves a list of active books from the library.
 */
const listBooks: Controller = async (req: Request, res: Response) => {
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
    .populate({ path: 'author', select: 'firstname lastname email bio website address' })
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
}

/**
 * @description Updates an existing book in the library.
 */
const updateBook: Controller = async (req: Request, res: Response) => {
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
  }

  const updatedBookData = {
    ...(name && { name }),
    ...(author && { author: author._id }),
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
}

/**
 * @description Temporarily removes a book from the library (soft delete).
 */
const softDeleteBook: Controller = async (req: Request, res: Response) => {
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
}

/**
 * @description Permanently deletes a book from the library.
 */
const hardDeleteBook: Controller = async (req: Request, res: Response) => {
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
}

/**
 * @description Uploads book's display photos.
 */
const uploadBookPhoto: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params

  const bookExists = await Book.findOne({ bookID, deletedAt: null })
  if (!bookExists) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  if (!req.file) {
    throw new HttpError(messageConstant.FILE_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

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
}

/**
 * @description Uploads book's cover photo.
 */
const uploadBookCoverPhoto: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params

  const bookExists = await Book.findOne({ bookID, deletedAt: null })
  if (!bookExists) {
    throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  if (!req.file) {
    throw new HttpError(messageConstant.FILE_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

  const existingCoverPhoto = await BookGallery.findOne({
    bookID: bookExists._id,
    imageName: 'coverImage',
    deletedAt: null
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
}

/**
 * @description Gets overall ratings summary of the specific book.
 */
const getRatingsSummary: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params

  const book = await Book.findOne({ bookID, deletedAt: null })
  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.NOT_FOUND)
  }

  const ratingsSummary = await getRatingService.getRatings(Number(book.bookID))
  if (!ratingsSummary) {
    throw new HttpError(messageConstant.NO_RATINGS_FOUND, httpStatusConstant.NOT_FOUND)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: ratingsSummary
  })
}

/**
 * @description Gets overall reviews summary of the specific book.
 */
const getReviewsSummary: Controller = async (req: Request, res: Response) => {
  const { bookID } = req.params
  const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
  const skip = (page - 1) * pageSize

  const book = await Book.findOne({ bookID, deletedAt: null })
  if (!book) {
    throw new HttpError(messageConstant.BOOK_NOT_EXISTS, httpStatusConstant.NOT_FOUND)
  }

  const reviewsSummary = await getReviewService.getReviews(String(book.bookID), skip, pageSize)
  if (!reviewsSummary) {
    throw new HttpError(messageConstant.NO_REVIEWS_FOUND, httpStatusConstant.NOT_FOUND)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: reviewsSummary
  })
}

/**
 * @description Imports google spreadsheet data into database
 */
const importBookSpreadSheet: Controller = async (req: Request, res: Response) => {
  const { sheetID, sheetname } = req.body

  if (!sheetID || !sheetname) {
    throw new HttpError(messageConstant.MISSING_REQUIRED_PARAMETERS, httpStatusConstant.BAD_REQUEST)
  }

  const sheetName = await googleSheetUtils.getSheetName(sheetID, sheetname)

  const data = await googleSheetUtils.fetchSheetData(sheetID, String(`${sheetName}!A2:Z`))
  if (!data) {
    throw new HttpError(messageConstant.NO_DATA_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const db = await dbConfig.connectToDatabase()
  if (!db) {
    throw new HttpError(messageConstant.CONNECTION_ERROR, httpStatusConstant.INTERNAL_SERVER_ERROR)
  }

  const collection = await databaseUtils.connectToCollection(db.connection, 'books')

  const formattedData = data
    .map((row: any) => {
      return {
        bookID: String(row[0]),
        name: row[1],
        author: ObjectId.createFromHexString(row[2]),
        charges: Number(row[3]),
        issueCount: Number(row[4]),
        submitCount: Number(row[5]),
        publishedDate: new Date(row[6]),
        subscriptionDays: Number(row[7]),
        quantityAvailable: Number(row[8]),
        numberOfFreeDays: Number(row[9]),
        description: row[10],
        deletedAt: row[12] === String(null) ? null : new Date(row[11])
      }
    })
    .filter(Boolean)

  for (const book of formattedData) {
    const existingBook = await collection.findOne({ bookID: book.bookID })
    console.log(book.bookID)

    if (existingBook) {
      await collection.updateOne({ bookID: book.bookID }, { $set: book })
    } else {
      await collection.insertOne(book)
    }
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.CREATED,
    message: messageConstant.DATA_ADDED_SUCCESSFULLY
  })
}

/**
 * @description Exports database collection into google spreadsheets
 */
const exportDataToSpreadsheet: Controller = async (req: Request, res: Response) => {
  const { sheetID, sheetname } = req.body

  if (!sheetID || !sheetname) {
    throw new HttpError(messageConstant.MISSING_REQUIRED_PARAMETERS, httpStatusConstant.BAD_REQUEST)
  }

  const sheetName = await googleSheetUtils.getSheetName(sheetID, sheetname)

  const data = await Book.find({ deletedAt: null }).populate('author').exec()

  const formattedData = data.map((row: any) => [
    row.bookID,
    row.name,
    row.author._id,
    row.charges,
    row.issueCount,
    row.submitCount,
    row.publishedDate ? row.publishedDate.toISOString().split('T')[0] : null,
    row.subscriptionDays,
    row.quantityAvailable,
    row.numberOfFreeDays,
    row.description,
    row.deletedAt ? row.deletedAt.toISOString().split('T')[0] : null
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

  const sheetData = await googleSheetUtils.fetchSheetData(sheetID, `${sheetName}!A:Z`)
  if (sheetData && sheetData.length > 0) {
    await googleSheetUtils.clearSheet(auth, sheetID, sheetName)
  }

  const exportStatus = await googleSheetUtils.appendDataToSheet(
    auth,
    sheetID,
    `${sheetName}!A1`,
    values
  )
  if (!exportStatus) {
    throw new HttpError(
      messageConstant.ERROR_EXPORTING_DATA,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }

  const columnWidthUpdates = [
    { startIndex: 0, endIndex: 1, pixelSize: 125 },
    { startIndex: 2, endIndex: 3, pixelSize: 125 },
    { startIndex: 6, endIndex: 7, pixelSize: 150 },
    { startIndex: 7, endIndex: 8, pixelSize: 130 },
    { startIndex: 8, endIndex: 9, pixelSize: 100 },
    { startIndex: 9, endIndex: 10, pixelSize: 100 },
    { startIndex: 10, endIndex: 11, pixelSize: 300 },
    { startIndex: 11, endIndex: 12, pixelSize: 300 }
  ]

  await googleSheetUtils.updateColumnWidths(auth, sheetID, columnWidthUpdates)

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: messageConstant.DATA_EXPORTED_SUCCESSFULLY
  })
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
