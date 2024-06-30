import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userAuthController } from '../../controllers'
import { userAuthSchema } from '../../validations'
import { userAuthMiddleware } from '../../middlewares'
import { upload } from '../../utils/multerConfig.utils'

const router: Router = express.Router()

router.post('/login', celebrate(userAuthSchema.login), userAuthController.login)
router.get('/get-access-token', userAuthController.generateNewAccessToken)
router.post('/logout', userAuthMiddleware.authMiddleware, userAuthController.logout)
router.post(
  '/forgot-password',
  celebrate(userAuthSchema.forgotPassword),
  userAuthController.forgotPassword
)
router.post(
  '/reset-password',
  celebrate(userAuthSchema.resetPassword),
  userAuthController.resetPassword
)
router.post(
  '/sign-up',
  celebrate(userAuthSchema.registerNewUser),
  userAuthController.registerNewUser
)
router.put(
  '/update-profile',
  celebrate(userAuthSchema.updateUserProfile),
  userAuthMiddleware.authMiddleware,
  userAuthController.updateUserProfile
)
router.put(
  '/upload-profile-photo/:email',
  celebrate(userAuthSchema.uploadUserProfilePhoto),
  userAuthMiddleware.uploadProfilePhotoAuth,
  userAuthMiddleware.authMiddleware,
  upload.single('profilePhoto'),
  userAuthController.uploadUserProfilePhoto
)

export default router
