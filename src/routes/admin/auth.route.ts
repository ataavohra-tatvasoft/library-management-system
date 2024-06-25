import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminAuthController } from '../../controllers'
import { adminAuthSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.post('/login', celebrate(adminAuthSchema.login), adminAuthController.login)
router.get('/get-access-token', adminAuthController.generateNewAccessToken)
router.post('/logout', adminAuthController.logout)
router.post(
  '/forgot-password',
  celebrate(adminAuthSchema.forgotPassword),
  adminAuthController.forgotPassword
)
router.post(
  '/reset-password',
  celebrate(adminAuthSchema.resetPassword),
  adminAuthController.resetPassword
)
router.put(
  '/update-profile/:email',
  celebrate(adminAuthSchema.updateAdminProfile),
  adminAuthMiddleware.authMiddleware,
  adminAuthController.updateAdminProfile
)

export default router
