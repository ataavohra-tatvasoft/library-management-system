import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminAuthController } from '../../controllers'
import { adminAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post('/login', celebrate(adminAuthSchema.login), adminAuthController.login)
router.get('/get-access-token', adminAuthController.generateNewAccessToken)
router.post('/logout', celebrate(adminAuthSchema.logout), adminAuthController.logout)
router.post(
  '/forgot-password',
  celebrate(adminAuthSchema.forgotPassword),
  adminAuthController.forgotPassword
)
router.post(
  '/reset-password',
  celebrate(adminAuthSchema.resetPassword),
  roleAuthMiddleware.checkUserRole(UserType.Librarian),
  userAuthMiddleware.authMiddleware,
  adminAuthController.resetPassword
)

export default router
