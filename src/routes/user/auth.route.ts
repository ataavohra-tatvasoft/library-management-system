import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userAuthController } from '../../controllers'
import { userAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { multerConfigUtils } from '../../utils'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post('/login', celebrate(userAuthSchema.login), userAuthController.login)
router.get('/new/access-token', userAuthController.generateNewAccessToken)
router.post('/logout', userAuthMiddleware.authMiddleware, userAuthController.logout)
router.post(
  '/forgot-password',
  celebrate(userAuthSchema.forgotPassword),
  userAuthController.forgotPassword
)
router.post(
  '/reset-password',
  celebrate(userAuthSchema.resetPassword),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthController.resetPassword
)
router.post(
  '/sign-up',
  celebrate(userAuthSchema.registerNewUser),
  userAuthController.registerNewUser
)
router.put(
  '/profile',
  celebrate(userAuthSchema.updateUserProfile),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthController.updateUserProfile
)
router.put(
  '/upload/profile-photo/:email',
  celebrate(userAuthSchema.uploadUserProfilePhoto),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.uploadProfilePhotoAuth,
  multerConfigUtils.upload.single('profilePhoto'),
  userAuthController.uploadUserProfilePhoto
)

export default router
