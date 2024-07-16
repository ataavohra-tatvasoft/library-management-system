import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminUserController } from '../../controllers'
import { adminUserSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/user/add',
  celebrate(adminUserSchema.registerUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminUserController.registerUser)
)
router.get(
  '/user/list',
  celebrate(adminUserSchema.getActiveUsersList),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminUserController.getActiveUsersList)
)
router.put(
  '/user/:email',
  celebrate(adminUserSchema.updateUserDetails),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminUserController.updateUserDetails)
)
router.put(
  '/user/soft-delete/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminUserController.deactivateUser)
)
router.delete(
  '/user/hard-delete/:email',
  celebrate(adminUserSchema.deactivateDeleteUser),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminUserController.deleteUserPermanently)
)

export default router
