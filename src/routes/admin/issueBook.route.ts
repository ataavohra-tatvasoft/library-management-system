import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminIssueBookController } from '../../controllers'
import { adminIssueBookSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.get(
  '/issue-book-list',
  celebrate(adminIssueBookSchema.getIssuedBooksList),
  adminAuthMiddleware.authMiddleware,
  adminIssueBookController.getIssuedBooksList
)
router.put(
  '/issue-book',
  celebrate(adminIssueBookSchema.issueBookToUser),
  adminAuthMiddleware.authMiddleware,
  adminIssueBookController.issueBookToUser
)
router.put(
  '/submit-book',
  celebrate(adminIssueBookSchema.submitBookForUser),
  adminAuthMiddleware.authMiddleware,
  adminIssueBookController.submitBookForUser
)

export default router
