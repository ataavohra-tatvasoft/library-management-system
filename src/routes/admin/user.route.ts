import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminUserController } from '../../controllers'
import { adminUserSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.post(
  '/create-user',
  celebrate(adminUserSchema.registerUser),
  adminAuthMiddleware.authMiddleware,
  adminUserController.registerUser
)
router.get(
  '/user-list',
  celebrate(adminUserSchema.getActiveUsersList),
  adminAuthMiddleware.authMiddleware,
  adminUserController.getActiveUsersList
)
router.put(
  '/update-user/:email',
  celebrate(adminUserSchema.updateUserDetails),
  adminAuthMiddleware.authMiddleware,
  adminUserController.updateUserDetails
)
router.put(
  '/soft-delete-user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  adminAuthMiddleware.authMiddleware,
  adminUserController.deactivateUser
)
router.delete(
  '/hard-delete-user/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  adminAuthMiddleware.authMiddleware,
  adminUserController.deleteUserPermanently
)

export default router
