import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { librarianBookController } from '../../controllers'
import { librarianBookSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/book',
  celebrate(librarianBookSchema.addBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianBookController.addBook)
)
router.get(
  '/book/list',
  celebrate(librarianBookSchema.listBooks),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianBookController.listBooks)
)
router.put(
  '/book/:bookID',
  celebrate(librarianBookSchema.updateBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianBookController.updateBook)
)
router.put(
  '/soft-delete/book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianBookController.softDeleteBook)
)
router.delete(
  '/hard-delete/book/:bookID',
  celebrate(librarianBookSchema.deleteBook),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  wrapperMiddleware.wrapController(librarianBookController.hardDeleteBook)
)

export default router
