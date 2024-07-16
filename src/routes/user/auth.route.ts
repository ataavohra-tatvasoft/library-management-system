import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userAuthController } from '../../controllers'
import { userAuthSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { multerConfigUtils } from '../../utils'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/login',
  celebrate(userAuthSchema.login),
  wrapperMiddleware.wrapController(userAuthController.login)
)
router.get(
  '/new/access-token',
  wrapperMiddleware.wrapController(userAuthController.generateNewAccessToken)
)
router.post(
  '/logout',
  userAuthMiddleware.auth,
  wrapperMiddleware.wrapController(userAuthController.logout)
)
router.post(
  '/forgot-password',
  celebrate(userAuthSchema.forgotPassword),
  wrapperMiddleware.wrapController(userAuthController.forgotPassword)
)
router.post(
  '/reset-password',
  celebrate(userAuthSchema.resetPassword),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userAuthController.resetPassword)
)
router.post(
  '/sign-up',
  celebrate(userAuthSchema.registerNewUser),
  wrapperMiddleware.wrapController(userAuthController.registerNewUser)
)
router.put(
  '/profile',
  celebrate(userAuthSchema.updateUserProfile),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userAuthController.updateUserProfile)
)
router.put(
  '/upload/profile-photo/:email',
  celebrate(userAuthSchema.uploadUserProfilePhoto),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.uploadProfilePhotoAuth,
  multerConfigUtils.upload.single('profilePhoto'),
  wrapperMiddleware.wrapController(userAuthController.uploadUserProfilePhoto)
)

export default router
