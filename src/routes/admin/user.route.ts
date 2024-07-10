import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminUserController } from '../../controllers'
import { adminUserSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/user',
  celebrate(adminUserSchema.registerUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminUserController.registerUser
)
router.get(
  '/user/list',
  celebrate(adminUserSchema.getActiveUsersList),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminUserController.getActiveUsersList
)
router.put(
  '/user/:email',
  celebrate(adminUserSchema.updateUserDetails),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminUserController.updateUserDetails
)
router.put(
  '/soft-delete/user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminUserController.deactivateUser
)
router.delete(
  '/hard-delete/user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminUserController.deleteUserPermanently
)

export default router
