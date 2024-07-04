import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminBookController } from '../../controllers'
import { adminBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'
// import { multerConfigUtils } from '../../utils'

const router: Router = express.Router()

router.post(
  '/add-book',
  celebrate(adminBookSchema.addBook),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.addBook
)
router.get(
  '/book-list',
  celebrate(adminBookSchema.listBooks),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.listBooks
)
router.put(
  '/update-book/:bookID',
  celebrate(adminBookSchema.updateBook),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.updateBook
)
router.put(
  '/soft-delete-book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.softDeleteBook
)
router.delete(
  '/hard-delete-book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.hardDeleteBook
)
router.post(
  '/upload-book-photo/:bookID',
  // multerConfigUtils.upload.single('bookPhoto'),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.uploadBookPhoto
)
router.put(
  '/upload-book-cover-photo/:bookID',
  // multerConfigUtils.upload.single('bookCoverPhoto'),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.uploadBookCoverPhoto
)
router.get(
  '/book-ratings-summary/:bookID',
  celebrate(adminBookSchema.getRatingsSummary),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.getRatingsSummary
)
router.get(
  '/book-reviews-summary/:bookID',
  celebrate(adminBookSchema.getReviewsSummary),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.getReviewsSummary
)
router.put(
  '/spreadsheet-import-books',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.importBookSpreadSheet
)
router.get(
  '/spreadsheet-export-books',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminBookController.exportDataToSpreadsheet
)

export default router
