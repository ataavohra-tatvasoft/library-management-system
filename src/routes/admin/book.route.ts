import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminBookController } from '../../controllers'
import { adminBookSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'
// import { multerConfigUtils } from '../../utils'

const router: Router = express.Router()

router.post(
  '/add-book',
  celebrate(adminBookSchema.addBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.addBook
)
router.get(
  '/book-list',
  celebrate(adminBookSchema.listBooks),
  adminAuthMiddleware.authMiddleware,
  adminBookController.listBooks
)
router.put(
  '/update-book/:bookID',
  celebrate(adminBookSchema.updateBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.updateBook
)
router.put(
  '/soft-delete-book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.softDeleteBook
)
router.delete(
  '/hard-delete-book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.hardDeleteBook
)
router.post(
  '/upload-book-photo/:bookID',
  // multerConfigUtils.upload.single('bookPhoto'),
  adminAuthMiddleware.authMiddleware,
  adminBookController.uploadBookPhoto
)
router.put(
  '/upload-book-cover-photo/:bookID',
  // multerConfigUtils.upload.single('bookCoverPhoto'),
  adminAuthMiddleware.authMiddleware,
  adminBookController.uploadBookCoverPhoto
)
router.get(
  '/book-ratings-summary/:bookID',
  celebrate(adminBookSchema.getRatingsSummary),
  adminAuthMiddleware.authMiddleware,
  adminBookController.getRatingsSummary
)
router.get(
  '/book-reviews-summary/:bookID',
  celebrate(adminBookSchema.getReviewsSummary),
  adminAuthMiddleware.authMiddleware,
  adminBookController.getReviewsSummary
)
router.put(
  '/spreadsheet-import-books',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  adminAuthMiddleware.authMiddleware,
  adminBookController.importBookSpreadSheet
)
router.get(
  '/spreadsheet-export-books',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  adminAuthMiddleware.authMiddleware,
  adminBookController.exportDataToSpreadsheet
)

export default router
