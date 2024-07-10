import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianBookController } from '../../controllers'
import { librarianBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/book',
  celebrate(librarianBookSchema.addBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianBookController.addBook
)
router.get(
  '/book/list',
  celebrate(librarianBookSchema.listBooks),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianBookController.listBooks
)
router.put(
  '/book/:bookID',
  celebrate(librarianBookSchema.updateBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianBookController.updateBook
)
router.put(
  '/soft-delete/book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianBookController.softDeleteBook
)
router.delete(
  '/hard-delete/book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  librarianBookController.hardDeleteBook
)

export default router
