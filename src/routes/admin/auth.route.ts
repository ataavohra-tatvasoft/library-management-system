import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminAuthController } from '../../controllers'
import { adminAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post('/login', celebrate(adminAuthSchema.login), adminAuthController.login)
router.get('/new/access-token', adminAuthController.generateNewAccessToken)
router.post('/logout', celebrate(adminAuthSchema.logout), adminAuthController.logout)
router.post(
  '/forgot-password',
  celebrate(adminAuthSchema.forgotPassword),
  adminAuthController.forgotPassword
)
router.post(
  '/reset-password',
  celebrate(adminAuthSchema.resetPassword),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminAuthController.resetPassword
)
router.put(
  '/profile',
  celebrate(adminAuthSchema.updateAdminProfile),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminAuthController.updateAdminProfile
)

export default router
