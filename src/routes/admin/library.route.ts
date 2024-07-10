import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibraryBranchController } from '../../controllers'
import { adminLibraryBranchSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/library-branch',
  celebrate(adminLibraryBranchSchema.registerNewBranch),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminLibraryBranchController.registerNewBranch
)
router.get(
  '/library-branch/list',
  celebrate(adminLibraryBranchSchema.getActiveBranchesList),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminLibraryBranchController.getActiveBranchesList
)
router.put(
  '/library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.updateBranchDetails),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminLibraryBranchController.updateBranchDetails
)
router.put(
  '/soft-delete/library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminLibraryBranchController.deactivateBranch
)
router.delete(
  '/hard-delete/library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  adminLibraryBranchController.deleteBranchPermanently
)

export default router
