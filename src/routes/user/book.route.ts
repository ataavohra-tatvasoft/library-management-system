import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userBookController } from '../../controllers'
import { userBookSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/search-book',
  celebrate(userBookSchema.searchBooks),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.searchBooks
)
router.get(
  '/book-details',
  celebrate(userBookSchema.getAllBookDetails),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getAllBookDetails
)
router.post(
  '/book/add-review',
  celebrate(userBookSchema.addBookReview),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.addBookReview
)
router.post(
  '/book/add-rating',
  celebrate(userBookSchema.addBookRating),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.addBookRating
)
router.get(
  '/book/issue-book-history',
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getBookIssueHistory
)
router.get(
  '/summary',
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getSummary
)
router.get(
  '/book-ratings-summary/:bookID',
  celebrate(userBookSchema.getBookRatingsSummary),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getBookRatingsSummary
)
router.get(
  '/book-reviews-summary/:bookID',
  celebrate(userBookSchema.getBookReviewsSummary),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getBookReviewsSummary
)
router.get(
  '/user-report',
  celebrate(userBookSchema.getReport),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userBookController.getReport
)

export default router
