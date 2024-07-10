import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianIssueBookController } from '../../controllers'
import { librarianIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/book/issued/list',
  celebrate(librarianIssueBookSchema.getIssuedBooksList),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianIssueBookController.getIssuedBooksList
)
router.put(
  '/book/issue',
  celebrate(librarianIssueBookSchema.issueBookToUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianIssueBookController.issueBookToUser
)
router.put(
  '/book/submit',
  celebrate(librarianIssueBookSchema.submitBookForUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianIssueBookController.submitBookForUser
)

export default router
