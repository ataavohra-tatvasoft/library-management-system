import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminBookController } from '../../controllers'
import { adminBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'
import { multerConfigUtils } from '../../utils'

const router: Router = express.Router()

router.post(
  '/book',
  celebrate(adminBookSchema.addBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.addBook)
)
router.get(
  '/book/list',
  celebrate(adminBookSchema.listBooks),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.listBooks)
)
router.put(
  '/book/:bookID',
  celebrate(adminBookSchema.updateBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.updateBook)
)
router.put(
  '/soft-delete/book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.softDeleteBook)
)
router.delete(
  '/hard-delete/book/:bookID',
  celebrate(adminBookSchema.deleteBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.hardDeleteBook)
)
router.post(
  '/book/photo/:bookID',
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  multerConfigUtils.upload.single('bookPhoto'),
  wrapperMiddleware.wrapController(adminBookController.uploadBookPhoto)
)
router.put(
  '/book/cover-photo/:bookID',
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  multerConfigUtils.upload.single('bookCoverPhoto'),
  wrapperMiddleware.wrapController(adminBookController.uploadBookCoverPhoto)
)
router.get(
  '/book/ratings/:bookID',
  celebrate(adminBookSchema.getRatingsSummary),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.getRatingsSummary)
)
router.get(
  '/book/reviews/:bookID',
  celebrate(adminBookSchema.getReviewsSummary),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.getReviewsSummary)
)
router.put(
  '/import/book',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.importBookSpreadSheet)
)
router.get(
  '/export/book',
  celebrate(adminBookSchema.importExportBookSpreadSheet),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminBookController.exportDataToSpreadsheet)
)

export default router
