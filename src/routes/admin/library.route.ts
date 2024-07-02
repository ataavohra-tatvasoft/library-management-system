import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { adminLibraryBranchController } from '../../controllers'
import { adminLibraryBranchSchema } from '../../validations'
import { adminAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.post(
  '/create-library-branch',
  celebrate(adminLibraryBranchSchema.registerNewBranch),
  adminAuthMiddleware.authMiddleware,
  adminLibraryBranchController.registerNewBranch
)
router.get(
  '/library-branch-list',
  celebrate(adminLibraryBranchSchema.getActiveBranchesList),
  adminAuthMiddleware.authMiddleware,
  adminLibraryBranchController.getActiveBranchesList
)
router.put(
  '/update-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.updateBranchDetails),
  adminAuthMiddleware.authMiddleware,
  adminLibraryBranchController.updateBranchDetails
)
router.put(
  '/soft-delete-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  adminAuthMiddleware.authMiddleware,
  adminLibraryBranchController.deactivateBranch
)
router.delete(
  '/hard-delete-library-branch/:branchID',
  celebrate(adminLibraryBranchSchema.deactivateDeleteBranch),
  adminAuthMiddleware.authMiddleware,
  adminLibraryBranchController.deleteBranchPermanently
)

export default router
