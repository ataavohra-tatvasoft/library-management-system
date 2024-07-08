import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userPaymentController } from '../../controllers'
import { userPaymentSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.put(
  '/add-card-holder/:email',
  celebrate(userPaymentSchema.addCardHolder),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userPaymentController.addCardHolder
)
router.post(
  '/add-issue-card/:email',
  celebrate(userPaymentSchema.addIssueCard),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userPaymentController.addIssueCard
)
router.get(
  '/get-add-card-link',
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userPaymentController.getAddCardLink
)
router.get('/template/add-payment-card/:email', userPaymentController.addPaymentCardPage)
router.post(
  '/add-payment-card/:email',
  celebrate(userPaymentSchema.addPaymentCard),
  userPaymentController.addPaymentCard
)
router.get(
  '/payment-card-list',
  celebrate(userPaymentSchema.paymentCardsList),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userPaymentController.paymentCardsList
)
router.put(
  '/pay-charges',
  celebrate(userPaymentSchema.payCharges),
  roleAuthMiddleware.checkUserRole(UserType.User),
  userAuthMiddleware.authMiddleware,
  userPaymentController.payCharges
)

export default router
