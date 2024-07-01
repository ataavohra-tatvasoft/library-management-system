import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userBookController } from '../../controllers'
import { userBookSchema } from '../../validations'
import { userAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.get(
  '/search-book',
  celebrate(userBookSchema.searchBooks),
  userAuthMiddleware.authMiddleware,
  userBookController.searchBooks
)

router.get('/book-details', userAuthMiddleware.authMiddleware, userBookController.getAllBookDetails)

router.post(
  '/book/add-review',
  celebrate(userBookSchema.addBookReview),
  userAuthMiddleware.authMiddleware,
  userBookController.addBookReview
)

router.post(
  '/book/add-rating',
  celebrate(userBookSchema.addBookRating),
  userAuthMiddleware.authMiddleware,
  userBookController.addBookRating
)

router.get(
  '/book/issue-book-history',
  userAuthMiddleware.authMiddleware,
  userBookController.getBookIssueHistory
)
router.get('/summary', userAuthMiddleware.authMiddleware, userBookController.getSummary)

router.get(
  '/book-ratings-summary/:bookID',
  celebrate(userBookSchema.getBookRatingsSummary),
  userAuthMiddleware.authMiddleware,
  userBookController.getBookRatingsSummary
)

router.get(
  '/book-reviews-summary/:bookID',
  celebrate(userBookSchema.getBookReviewsSummary),
  userAuthMiddleware.authMiddleware,
  userBookController.getBookReviewsSummary
)

router.get(
  '/user-report',
  celebrate(userBookSchema.getReport),
  userAuthMiddleware.authMiddleware,
  userBookController.getReport
)

export default router
