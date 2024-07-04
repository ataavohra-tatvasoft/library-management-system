import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userAuthController } from '../../controllers'
import { userAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { multerConfigUtils } from '../../utils'
import { UserType } from '../../types'

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
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
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
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userAuthController.updateUserProfile
)
router.put(
  '/upload-profile-photo/:email',
  celebrate(userAuthSchema.uploadUserProfilePhoto),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userAuthMiddleware.uploadProfilePhotoAuth,
  multerConfigUtils.upload.single('profilePhoto'),
  userAuthController.uploadUserProfilePhoto
)

export default router
