import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminAuthController } from '../../controllers'
import { adminAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/login',
  celebrate(adminAuthSchema.login),
  wrapperMiddleware.wrapController(adminAuthController.login)
)
router.get(
  '/new/access-token',
  wrapperMiddleware.wrapController(adminAuthController.generateNewAccessToken)
)
router.post(
  '/logout',
  celebrate(adminAuthSchema.logout),
  wrapperMiddleware.wrapController(adminAuthController.logout)
)
router.post(
  '/forgot-password',
  celebrate(adminAuthSchema.forgotPassword),
  wrapperMiddleware.wrapController(adminAuthController.forgotPassword)
)
router.post(
  '/reset-password',
  celebrate(adminAuthSchema.resetPassword),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminAuthController.resetPassword)
)
router.put(
  '/profile',
  celebrate(adminAuthSchema.updateAdminProfile),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminAuthController.updateAdminProfile)
)

export default router
