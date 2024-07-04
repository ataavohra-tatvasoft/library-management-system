import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibrarianController } from '../../controllers'
import { adminLibrarianSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/create-librarian',
  celebrate(adminLibrarianSchema.signupLibrarian),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibrarianController.signupLibrarian
)

export default router
