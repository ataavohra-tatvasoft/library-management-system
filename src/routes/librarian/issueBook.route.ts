import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianIssueBookController } from '../../controllers'
import { librarianIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/issued/list',
  celebrate(librarianIssueBookSchema.getIssuedBooksList),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianIssueBookController.getIssuedBooksList)
)
router.put(
  '/book/issue/:bookID',
  celebrate(librarianIssueBookSchema.issueBookToUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianIssueBookController.issueBookToUser)
)
router.put(
  '/book/submit/:bookID',
  celebrate(librarianIssueBookSchema.submitBookForUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianIssueBookController.submitBookForUser)
)

export default router
