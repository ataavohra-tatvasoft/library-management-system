import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminUserController } from '../../controllers'
import { adminUserSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/create-user',
  celebrate(adminUserSchema.registerUser),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminUserController.registerUser
)
router.get(
  '/user-list',
  celebrate(adminUserSchema.getActiveUsersList),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminUserController.getActiveUsersList
)
router.put(
  '/update-user/:email',
  celebrate(adminUserSchema.updateUserDetails),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminUserController.updateUserDetails
)
router.put(
  '/soft-delete-user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminUserController.deactivateUser
)
router.delete(
  '/hard-delete-user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminUserController.deleteUserPermanently
)

export default router
