import express, { Router } from 'express'
import { celebrate } from 'celebrate'
import { userPaymentController } from '../../controllers'
import { userPaymentSchema } from '../../validations'
import { userAuthMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.get(
  '/get-add-card-link',
  userAuthMiddleware.authMiddleware,
  userPaymentController.getAddCardLink
)
router.get('/template/add-payment-card/:email', userPaymentController.addPaymentCardPage)
router.post(
  '/add-payment-card/:email',
  celebrate(userPaymentSchema.addPaymentCard),
  // userAuthMiddleware.authMiddleware,
  userPaymentController.addPaymentCard
)
router.get(
  '/payment-card-list',
  celebrate(userPaymentSchema.paymentCardsList),
  userAuthMiddleware.authMiddleware,
  userPaymentController.paymentCardsList
)
router.put(
  '/pay-charges',
  celebrate(userPaymentSchema.payCharges),
  userAuthMiddleware.authMiddleware,
  userPaymentController.payCharges
)

export default router
