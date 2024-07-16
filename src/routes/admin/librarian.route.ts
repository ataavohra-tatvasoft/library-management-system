import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibrarianController } from '../../controllers'
import { adminLibrarianSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/librarian',
  celebrate(adminLibrarianSchema.signupLibrarian),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibrarianController.signupLibrarian)
)

export default router
