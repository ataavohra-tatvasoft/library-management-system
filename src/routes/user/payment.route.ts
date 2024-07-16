import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userPaymentController } from '../../controllers'
import { userPaymentSchema } from '../../validations'
import { roleAuthMiddleware, userAuthMiddleware, wrapperMiddleware } from '../../middlewares'
import { UserType } from '../../types'

const router: Router = express.Router()

router.put(
  '/add/card-holder/:email',
  celebrate(userPaymentSchema.addCardHolder),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userPaymentController.addCardHolder)
)
router.post(
  '/issue-card/:email',
  celebrate(userPaymentSchema.addIssueCard),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userPaymentController.addIssueCard)
)
router.get(
  '/link/add-card',
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userPaymentController.getAddCardLink)
)
router.get(
  '/template/payment-card/:email',
  wrapperMiddleware.wrapController(userPaymentController.addPaymentCardPage)
)
router.post(
  '/payment-card/:email',
  celebrate(userPaymentSchema.addPaymentCard),
  wrapperMiddleware.wrapController(userPaymentController.addPaymentCard)
)
router.get(
  '/payment-card/list',
  celebrate(userPaymentSchema.paymentCardsList),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userPaymentController.paymentCardsList)
)
router.put(
  '/pay-charges',
  celebrate(userPaymentSchema.payCharges),
  userAuthMiddleware.auth,
  roleAuthMiddleware.checkUserRole(UserType.User),
  wrapperMiddleware.wrapController(userPaymentController.payCharges)
)

export default router
