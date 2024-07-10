import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminBookController } from '../../controllers'
import { adminBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/book',
  celebrate(adminBookSchema.addBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.addBook
)
router.get(
  '/book/list',
  celebrate(adminBookSchema.listBooks),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.listBooks
)
router.put(
  '/book/:bookID',
  celebrate(adminBookSchema.updateBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.updateBook
)
router.put(
  '/soft-delete/book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.softDeleteBook
)
router.delete(
  '/hard-delete/book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.hardDeleteBook
)
router.post(
  '/book/photo/:bookID',
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.uploadBookPhoto
)
router.put(
  '/book/cover-photo/:bookID',
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.uploadBookCoverPhoto
)
router.get(
  '/book/ratings/:bookID',
  celebrate(adminBookSchema.getRatingsSummary),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.getRatingsSummary
)
router.get(
  '/book/reviews/:bookID',
  celebrate(adminBookSchema.getReviewsSummary),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.getReviewsSummary
)
router.put(
  '/import/book',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.importBookSpreadSheet
)
router.get(
  '/export/book',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminBookController.exportDataToSpreadsheet
)

export default router
