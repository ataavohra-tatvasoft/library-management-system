import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianBookController } from '../../controllers'
import { librarianBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/add-book',
  celebrate(librarianBookSchema.addBook),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianBookController.addBook
)
router.get(
  '/book-list',
  celebrate(librarianBookSchema.listBooks),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianBookController.listBooks
)
router.put(
  '/update-book/:bookID',
  celebrate(librarianBookSchema.updateBook),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianBookController.updateBook
)
router.put(
  '/soft-delete-book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianBookController.softDeleteBook
)
router.delete(
  '/hard-delete-book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  librarianBookController.hardDeleteBook
)

export default router
