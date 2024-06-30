import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import Stripe from 'stripe'
import { User } from '../../db/models'
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../../constant'
import { Controller } from '../../interfaces'
import {
  authUtils,
  ejsCompilerUtils,
  paymentUtils,
  responseHandlerUtils,
  sendMailUtils
} from '../../utils'
import { envConfig } from '../../config'
import { PaymentCard } from '../../db/models/paymentCard.model'
import { HttpError } from '../../libs'

/**
 * @description get link for adding payment card
 */
const getAddCardLink: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const addCardLink = `http://${envConfig.serverHost}:${envConfig.serverPort}/user/template/add-payment-card/${verifiedToken?.email}`

    const html = await ejsCompilerUtils.compileTemplate('getAddCardLink', {
      link: addCardLink
    })

    await sendMailUtils.sendEmail({
      to: verifiedToken?.email,
      subject: 'Add Payment Card Link',
      html
    })

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

    const link = `http://${envConfig.serverHost}:${envConfig.serverPort}/user/add-payment-card/${email}`

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
    const { email } = req.params
    const { cardID, cardBrand, expirationMonth, expirationYear, cardLastFour, token } = req.body
    let isDefault = true

    if (!cardID || !cardBrand || !expirationMonth || !expirationYear || !cardLastFour || !token) {
      throw new HttpError(
        messageConstant.MISSING_PAYMENT_CARD_DETAILS,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
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

    const hashedLastFourDigits = await bcrypt.hash(cardLastFour, Number(envConfig.saltRounds))

    const paymentCardExists = await PaymentCard.findOne({
      userID: user?._id,
      cardID,
      paymentMethodID: paymentMethod.id,
      cardBrand,
      expirationMonth,
      expirationYear,
      cardLastFour: hashedLastFourDigits
    })
    if (paymentCardExists) {
      isDefault = false
    }

    const newPaymentCard = await PaymentCard.create({
      userID: user?._id,
      cardID,
      paymentMethodID: paymentMethod.id,
      cardBrand,
      expirationMonth,
      expirationYear,
      cardLastFour: hashedLastFourDigits,
      isDefault
    })
    if (!newPaymentCard) {
      throw new HttpError(
        messageConstant.ERROR_WHILE_ADDING_PAYMENT_CARD,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const updateUser = await User.updateOne(
      { email: user?.email },
      { $set: { stripeCustomerID: customer.id } }
    )
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
    let { page, pageSize } = req.query
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)
    const pageNumber = Number(page) || 1
    const limit = Number(pageSize) || 10
    const skip = (pageNumber - 1) * limit

    const totalBooksCount = await PaymentCard.countDocuments({ deletedAt: null })
    const totalPages = Math.ceil(totalBooksCount / limit)

    if (pageNumber > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const paymentCardLists = await PaymentCard.find({ userID: verifiedToken?._id, deletedAt: null })
      .skip(skip)
      .limit(limit)
    if (!paymentCardLists?.length) {
      throw new HttpError(messageConstant.NO_PAYMENT_CARDS_FOUND, httpStatusConstant.NOT_FOUND)
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
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    const { amount, cardID, cardBrand, expirationMonth, expirationYear, cardLastFour } = req.body
    const stripe = new Stripe(String(envConfig.stripeApiKey))

    if (!amount || !cardID || !cardBrand || !expirationMonth || !expirationYear || !cardLastFour) {
      throw new HttpError(
        messageConstant.MISSING_PAYMENT_CARD_DETAILS,
        httpStatusConstant.BAD_REQUEST
      )
    }
    const user = await User.findById({ _id: verifiedToken?._id })

    if (Number(amount) < 50) {
      throw new HttpError(messageConstant.MINIMUM_CHARGE_INVALID, httpStatusConstant.BAD_REQUEST)
    }

    const paymentCard = await PaymentCard.findOne({
      userID: user?._id,
      cardID,
      cardBrand,
      expirationMonth,
      expirationYear
    })
    if (!paymentCard) {
      throw new HttpError(messageConstant.NO_PAYMENT_CARDS_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const isPaymentCardValid = await bcrypt.compare(cardLastFour, paymentCard.cardLastFour)
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
      customer: user?.stripeCustomerID
    })

    const confirmResult = await stripe.paymentIntents.confirm(paymentIntent.id, {
      // eslint-disable-next-line camelcase
      payment_method: String(paymentCard.paymentMethodID)
    })
    if (confirmResult.status === 'succeeded') {
      const updatedDueCharges: number = Number(user?.dueCharges) - Number(amount)
      await User.updateOne({ _id: user?._id }, { $set: { dueCharges: updatedDueCharges } })

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
