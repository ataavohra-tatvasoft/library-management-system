import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminIssueBookController } from '../../controllers'
import { adminIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/issued/list',
  celebrate(adminIssueBookSchema.getIssuedBooksList),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminIssueBookController.getIssuedBooksList)
)
router.put(
  '/book/issue/:bookID',
  celebrate(adminIssueBookSchema.issueBookToUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminIssueBookController.issueBookToUser)
)
router.put(
  '/book/submit/:bookID',
  celebrate(adminIssueBookSchema.submitBookForUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminIssueBookController.submitBookForUser)
)

export default router
