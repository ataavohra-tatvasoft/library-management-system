import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminIssueBookController } from '../../controllers'
import { adminIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/issued/list',
  celebrate(adminIssueBookSchema.getIssuedBooksList),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminIssueBookController.getIssuedBooksList
)
router.put(
  '/book/issue',
  celebrate(adminIssueBookSchema.issueBookToUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminIssueBookController.issueBookToUser
)
router.put(
  '/book/submit',
  celebrate(adminIssueBookSchema.submitBookForUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminIssueBookController.submitBookForUser
)

export default router
