import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianIssueBookController } from '../../controllers'
import { librarianIssueBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.get(
  '/issue-book-list',
  celebrate(librarianIssueBookSchema.getIssuedBooksList),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianIssueBookController.getIssuedBooksList
)
router.put(
  '/issue-book',
  celebrate(librarianIssueBookSchema.issueBookToUser),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianIssueBookController.issueBookToUser
)
router.put(
  '/submit-book',
  celebrate(librarianIssueBookSchema.submitBookForUser),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianIssueBookController.submitBookForUser
)

export default router
