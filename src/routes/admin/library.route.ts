import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibraryBranchController } from '../../controllers'
import { adminLibraryBranchSchema } from '../../validations'
import { userAuthMiddleware, roleAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.post(
  '/create-library-branch',
  celebrate(adminLibraryBranchSchema.registerNewBranch),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibraryBranchController.registerNewBranch
)
router.get(
  '/library-branch-list',
  celebrate(adminLibraryBranchSchema.getActiveBranchesList),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibraryBranchController.getActiveBranchesList
)
router.put(
  '/update-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.updateBranchDetails),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibraryBranchController.updateBranchDetails
)
router.put(
  '/soft-delete-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibraryBranchController.deactivateBranch
)
router.delete(
  '/hard-delete-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  roleAuthMiddleware.checkUserRole(UserType.Admin),
  userAuthMiddleware.authMiddleware,
  adminLibraryBranchController.deleteBranchPermanently
)

export default router
