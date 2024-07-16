import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userBookController } from '../../controllers'
import { userBookSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/search',
  celebrate(userBookSchema.searchBooks),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.searchBooks)
)
router.get(
  '/book/details',
  celebrate(userBookSchema.getAllBookDetails),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getAllBookDetails)
)
router.post(
  '/book/review',
  celebrate(userBookSchema.addBookReview),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.addBookReview)
)
router.post(
  '/book/rating',
  celebrate(userBookSchema.addBookRating),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.addBookRating)
)
router.get(
  '/book/issued/history',
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getBookIssueHistory)
)
router.get(
  '/summary',
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getSummary)
)
router.get(
  '/book/ratings/:bookID',
  celebrate(userBookSchema.getBookRatingsSummary),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getBookRatingsSummary)
)
router.get(
  '/book/reviews/:bookID',
  celebrate(userBookSchema.getBookReviewsSummary),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getBookReviewsSummary)
)
router.get(
  '/user/report',
  celebrate(userBookSchema.getReport),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userBookController.getReport)
)

export default router
