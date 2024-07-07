import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import Stripe from 'stripe'
import { User, PaymentCard } from '../../db/models'
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
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces'

const STRIPE = new Stripe(String(envConfig.stripeApiKey))

/**
 * @description Adds a cardholder for the user
 */
const addCardHolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    if (user.cardHolderId) {
      throw new HttpError(
        messageConstant.CARD_HOLDER_ALREADY_EXISTS,
        httpStatusConstant.BAD_REQUEST
      )
    }

    const cardholder = await STRIPE.issuing.cardholders.create({
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      // eslint-disable-next-line camelcase
      phone_number: String(user.mobileNumber),
      status: 'active',
      type: 'individual',
      individual: {
        // eslint-disable-next-line camelcase
        first_name: user.firstname,
        // eslint-disable-next-line camelcase
        last_name: user.lastname,
        dob: { day: 1, month: 11, year: 2003 }
      },
      billing: {
        address: {
          line1: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          // eslint-disable-next-line camelcase
          postal_code: 'EC1Y 8SY',
          country: 'GB'
        }
      }
    })

    if (!cardholder) {
      throw new HttpError(messageConstant.CARD_HOLDER_FAILED, httpStatusConstant.BAD_REQUEST)
    }

    await User.updateOne({ email }, { $set: { cardHolderId: cardholder.id } })

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.CARD_HOLDER_SAVED,
      data: cardholder
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Adds a card for the user
 */
const addIssueCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const card = await STRIPE.issuing.cards.create({
      cardholder: user.cardHolderId,
      currency: 'usd',
      type: 'virtual'
    })

    const cardActivated = await STRIPE.issuing.cards.update(card.id, { status: 'active' })

    //Error is encountered from below code
    const paymentMethod = await STRIPE.paymentMethods.create({
      type: 'card',
      card: { token: cardActivated.id },
      // eslint-disable-next-line camelcase
      billing_details: { email: user.email }
    })

    if (!paymentMethod) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_PAYMENT_METHOD,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const cardLastFour = cardActivated.last4
    const hashedLastFourDigits = await bcrypt.hash(cardLastFour, Number(envConfig.saltRounds))

    const newPaymentCard = await PaymentCard.create({
      userID: user._id,
      cardID: card.id,
      paymentMethodID: paymentMethod.id,
      cardBrand: card.brand,
      expirationMonth: card.exp_month,
      expirationYear: card.exp_year,
      cardLastFour: hashedLastFourDigits,
      isDefault: true
    })

    if (!newPaymentCard) {
      throw new HttpError(
        messageConstant.ERROR_WHILE_ADDING_PAYMENT_CARD,
        httpStatusConstant.BAD_REQUEST
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.CARD_SAVED,
      data: cardActivated
    })
  } catch (error) {
    return next(error)
  }
}

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
const addPaymentCard = async (req: Request, res: Response, next: NextFunction) => {
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

    const hashedLastFourDigits = await bcrypt.hash(cardLastFour, Number(envConfig.saltRounds))
    const paymentCardExists = await PaymentCard.findOne({
      userID: user._id,
      cardID,
      cardBrand,
      expirationMonth,
      expirationYear
    })

    if (paymentCardExists) {
      throw new HttpError(messageConstant.CARD_ALREADY_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const customer = await paymentUtils.createStripeCustomer(user)
    if (!customer) {
      throw new HttpError(
        messageConstant.ERROR_WHILE_CREATING_STRIPE_CUSTOMER,
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

    const paymentMethod = await paymentUtils.createStripePaymentMethod(customer, {
      token
    })
    if (!paymentMethod) {
      throw new HttpError(messageConstant.INVALID_CARD_CREDENTIALS, httpStatusConstant.BAD_REQUEST)
    }

    const newPaymentCard = await PaymentCard.create({
      userID: user._id,
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
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)
    const skip = (page - 1) * pageSize

    const totalBooksCount = await PaymentCard.countDocuments({ deletedAt: null })
    if (!totalBooksCount) {
      throw new HttpError(messageConstant.NO_PAYMENT_CARDS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const totalPages = Math.ceil(totalBooksCount / pageSize)

    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const paymentCardLists = await PaymentCard.find({ userID: verifiedToken?._id, deletedAt: null })
      .skip(skip)
      .limit(pageSize)
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

    const paymentIntent = await STRIPE.paymentIntents.create({
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

    const confirmResult = await STRIPE.paymentIntents.confirm(paymentIntent.id, {
      // eslint-disable-next-line camelcase
      payment_method: String(paymentCard.paymentMethodID)
    })
    switch (confirmResult.status) {
      case 'succeeded': {
        const updatedDueCharges = Number(user?.dueCharges) - Number(amount)
        await User.updateOne(
          { _id: user?._id },
          { $set: { dueCharges: updatedDueCharges, paidAmount: Number(amount) } }
        )

        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.OK,
          message: messageConstant.PAYMENT_SUCCESSFUL
        })
      }

      case 'processing': {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.OK,
          message: messageConstant.PAYMENT_PROCESSING
        })
      }

      case 'requires_payment_method': {
        throw new HttpError(messageConstant.INVALID_PAYMENT_METHOD, httpStatusConstant.BAD_REQUEST)
      }

      case 'requires_confirmation': {
        throw new HttpError(
          messageConstant.PAYMENT_NEEDS_CONFIRMATION,
          httpStatusConstant.BAD_REQUEST
        )
      }

      case 'requires_action': {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.OK,
          message: messageConstant.REQUIRES_ADDITIONAL_ACTION
        })
      }

      case 'requires_capture': {
        return responseHandlerUtils.responseHandler(res, {
          statusCode: httpStatusConstant.OK,
          message: messageConstant.PAYMENT_REQUIRES_CAPTURE
        })
      }

      case 'canceled': {
        throw new HttpError(messageConstant.PAYMENT_CANCELED, httpStatusConstant.BAD_REQUEST)
      }

      default: {
        throw new HttpError(messageConstant.UNKNOWN_PAYMENT_STATUS, httpStatusConstant.BAD_REQUEST)
      }
    }
  } catch (error) {
    return next(error)
  }
}

export default {
  addIssueCard,
  addCardHolder,
  addPaymentCard,
  addPaymentCardPage,
  paymentCardsList,
  payCharges,
  getAddCardLink
}
