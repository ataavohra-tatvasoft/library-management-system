import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import Stripe from 'stripe'
import { User } from '../../db/models'
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant'
import { Controller } from '../../interfaces'
import { ejsCompilerUtils, paymentUtils, responseHandlerUtils, sendMailUtils } from '../../utils'
import { envConfig } from '../../config'
import { PaymentCard } from '../../db/models/paymentCard.model'
import { HttpError } from '../../types/error'

/**
 * @description get link for adding payment card
 */
const getAddCardLink: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const addCardLink = `http://${envConfig.serverHost}:${envConfig.serverPort}/user/template/add-payment-card/${email}`

    const html = await ejsCompilerUtils.compileTemplate('getAddCardLink', {
      link: addCardLink
    })

    await sendMailUtils.sendEmail({ to: email, subject: 'Add Payment Card Link', html })

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description send add payment card page
 */
const addPaymentCardPage: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const link = `http://${envConfig.serverHost}:${envConfig.serverPort}}/user/add-payment-card/${email}`

    const data = {
      link: link,
      publicKey: `pk_test_51PV91OI98oGzZ2rhhlIN1zSTzZ1CjyOjN48dks6cqt0u7Oeu4YOBv7E79JFTE6IMPJbGvUngfQm5OCOfBJB3b2uO00rZPlWkTm`
    }

    const html = await ejsCompilerUtils.compileTemplate('addPaymentCard', data)

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
    return res.end()
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Adds payment card for user
 */
const addPaymentCard: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardNumber, cardBrand, expirationMonth, expirationYear, cvv, token } = req.body
    const { email } = req.params
    let isDefault = true

    if (!cardNumber || !cardBrand || !expirationMonth || !expirationYear || !cvv) {
      throw new HttpError(
        messageConstant.MISSING_PAYMENT_CARD_DETAILS,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const customer = await paymentUtils.createStripeCustomer(user)
    if (!customer) {
      throw new HttpError(
        messageConstant.ERROR_WHILE_CREATING_STRIPE_CUSTOMER,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const paymentMethod = await paymentUtils.createStripePaymentMethod(customer, {
      token
    })
    if (!paymentMethod) {
      throw new HttpError(messageConstant.INVALID_CARD_CREDENTIALS, httpStatusConstant.BAD_REQUEST)
    }

    const lastFourDigits = cardNumber.slice(-4)

    const hashedLastFourDigits = await bcrypt.hash(lastFourDigits, Number(envConfig.saltRounds))

    const paymentCardExists = await PaymentCard.findOne({
      userID: user._id,
      paymentMethodID: paymentMethod.id,
      cardBrand,
      lastFourDigits: hashedLastFourDigits,
      expirationMonth,
      expirationYear,
      cvv
    })
    if (paymentCardExists) {
      isDefault = false
    }

    const newPaymentCard = await PaymentCard.create({
      userID: user._id,
      paymentMethodID: paymentMethod.id,
      cardBrand,
      lastFourDigits: hashedLastFourDigits,
      expirationMonth,
      expirationYear,
      cvv,
      isDefault
    })
    if (!newPaymentCard) {
      throw new HttpError(
        messageConstant.ERROR_WHILE_ADDING_PAYMENT_CARD,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const updateUser = await User.updateOne({ email }, { $set: { stripeCustomerID: customer.id } })
    if (!updateUser) {
      throw new HttpError(messageConstant.ERROR_UPDATING_USER, httpStatusConstant.NOT_FOUND)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.CREATED,
      message: messageConstant.PAYMENT_CARD_ADDED_SUCCESSFULLY
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Lists payment card of the user
 */
const paymentCardsList: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const paymentCardLists = await PaymentCard.find({ userID: user._id, deletedAt: null })
    if (!paymentCardLists) {
      throw new HttpError(messageConstant.NO_PAYMENT_CARDS_FOUND, httpStatusConstant.CREATED)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL,
      data: {
        paymentCardLists
      }
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Executes payment for user for its due charges
 */
const payCharges: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, cardNumber, cardBrand, expirationMonth, expirationYear, cvv } = req.body
    const { email } = req.params
    const stripe = new Stripe(String(envConfig.stripeApiKey))

    if (!cardNumber || !cardBrand || !expirationMonth || !expirationYear || !cvv) {
      throw new HttpError(
        messageConstant.MISSING_PAYMENT_CARD_DETAILS,
        httpStatusConstant.BAD_REQUEST
      )
    }
    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }
    if (Number(amount) < 50) {
      throw new HttpError(messageConstant.MINIMUM_CHARGE_INVALID, httpStatusConstant.BAD_REQUEST)
    }

    const paymentCard = await PaymentCard.findOne({
      userID: user._id,
      cardBrand,
      expirationMonth,
      expirationYear,
      cvv: Number(cvv)
    })

    if (!paymentCard) {
      throw new HttpError(messageConstant.NO_PAYMENT_CARDS_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const lastFourDigits = cardNumber.slice(-4)

    const isPaymentCardValid = await bcrypt.compare(lastFourDigits, paymentCard.lastFourDigits)
    if (!isPaymentCardValid) {
      throw new HttpError(messageConstant.INVALID_CARD_CREDENTIALS, httpStatusConstant.UNAUTHORIZED)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: 'inr',
      // eslint-disable-next-line camelcase
      automatic_payment_methods: {
        enabled: true,
        // eslint-disable-next-line camelcase
        allow_redirects: 'never'
      },
      customer: user.stripeCustomerID
    })

    const confirmResult = await stripe.paymentIntents.confirm(paymentIntent.id, {
      // eslint-disable-next-line camelcase
      payment_method: String(paymentCard.paymentMethodID)
    })

    if (confirmResult.status === 'succeeded') {
      const updatedDueCharges: number = Number(user.dueCharges) - Number(amount)
      await User.updateOne({ email }, { $set: { dueCharges: updatedDueCharges } })

      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.OK,
        message: messageConstant.PAYMENT_SUCCESSFUL
      })
    } else {
      console.error('Payment failed:', confirmResult)
      throw new HttpError(messageConstant.PAYMENT_FAILED, httpStatusConstant.BAD_REQUEST)
    }
  } catch (error) {
    return next(error)
  }
}

export default {
  addPaymentCard,
  addPaymentCardPage,
  paymentCardsList,
  payCharges,
  getAddCardLink
}
