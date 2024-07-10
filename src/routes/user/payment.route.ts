import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userPaymentController } from '../../controllers'
import { userPaymentSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.put(
  '/add/card-holder/:email',
  celebrate(userPaymentSchema.addCardHolder),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userPaymentController.addCardHolder
)
router.post(
  '/issue-card/:email',
  celebrate(userPaymentSchema.addIssueCard),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userPaymentController.addIssueCard
)
router.get(
  '/link/add-card',
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userPaymentController.getAddCardLink
)
router.get('/template/payment-card/:email', userPaymentController.addPaymentCardPage)
router.post(
  '/payment-card/:email',
  celebrate(userPaymentSchema.addPaymentCard),
  userPaymentController.addPaymentCard
)
router.get(
  '/payment-card/list',
  celebrate(userPaymentSchema.paymentCardsList),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userPaymentController.paymentCardsList
)
router.put(
  '/pay-charges',
  celebrate(userPaymentSchema.payCharges),
  userAuthMiddleware.authMiddleware,
  roleAuthMiddleware.checkUserRole(UserType.User),
  userPaymentController.payCharges
)

export default router
