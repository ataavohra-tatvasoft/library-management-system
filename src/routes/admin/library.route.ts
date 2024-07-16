import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibraryBranchController } from '../../controllers'
import { adminLibraryBranchSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/library-branch',
  celebrate(adminLibraryBranchSchema.registerNewBranch),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibraryBranchController.registerNewBranch)
)
router.get(
  '/library-branch/list',
  celebrate(adminLibraryBranchSchema.getActiveBranchesList),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibraryBranchController.getActiveBranchesList)
)
router.put(
  '/library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.updateBranchDetails),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibraryBranchController.updateBranchDetails)
)
router.put(
  '/library-branch/soft-delete/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibraryBranchController.deactivateBranch)
)
router.delete(
  '/library-branch/hard-delete/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  wrapperMiddleware.wrapController(adminLibraryBranchController.deleteBranchPermanently)
)

export default router
