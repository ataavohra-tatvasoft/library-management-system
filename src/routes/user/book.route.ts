import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userBookController } from '../../controllers'
import { userBookSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/search',
  celebrate(userBookSchema.searchBooks),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.searchBooks
)
router.get(
  '/book/details',
  celebrate(userBookSchema.getAllBookDetails),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getAllBookDetails
)
router.post(
  '/book/review',
  celebrate(userBookSchema.addBookReview),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.addBookReview
)
router.post(
  '/book/rating',
  celebrate(userBookSchema.addBookRating),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.addBookRating
)
router.get(
  '/book/issued/history',
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getBookIssueHistory
)
router.get(
  '/summary',
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getSummary
)
router.get(
  '/book/ratings/:bookID',
  celebrate(userBookSchema.getBookRatingsSummary),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getBookRatingsSummary
)
router.get(
  '/book/reviews/:bookID',
  celebrate(userBookSchema.getBookReviewsSummary),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getBookReviewsSummary
)
router.get(
  '/user/report',
  celebrate(userBookSchema.getReport),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userBookController.getReport
)

export default router
