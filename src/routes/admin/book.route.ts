import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminBookController } from '../../controllers'
import { adminBookSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'
import { upload } from '../../utils/multerConfig.utils'

const router: Router = express.Router()

router.post(
  '/add-book',
  celebrate(adminBookSchema.addBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.addBook
)
router.put(
  '/update-book/:bookID',
  celebrate(adminBookSchema.updateBook),
  adminAuthMiddleware.authMiddleware,
  adminBookController.updateBook
)
router.get('/book-list', adminAuthMiddleware.authMiddleware, adminBookController.listBooks)

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
  upload.single('bookPhoto'),
  adminAuthMiddleware.authMiddleware,
  adminBookController.uploadBookPhoto
)

router.put(
  '/upload-book-cover-photo/:bookID',
  upload.single('bookCoverPhoto'),
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

export default router
