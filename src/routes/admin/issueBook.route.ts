import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminIssueBookController } from '../../controllers'
import { adminIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/issue-book-list',
  celebrate(adminIssueBookSchema.getIssuedBooksList),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminIssueBookController.getIssuedBooksList
)
router.put(
  '/issue-book',
  celebrate(adminIssueBookSchema.issueBookToUser),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminIssueBookController.issueBookToUser
)
router.put(
  '/submit-book',
  celebrate(adminIssueBookSchema.submitBookForUser),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminIssueBookController.submitBookForUser
)

export default router
