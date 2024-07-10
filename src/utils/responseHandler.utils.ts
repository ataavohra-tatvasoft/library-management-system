import { Response } from 'express'
import Stripe from 'stripe'
import { CelebrateError, isCelebrateError } from 'celebrate'
import { loggerUtils } from '../utils'
import { httpErrorMessageConstant, httpStatusConstant } from '../constant'
import { ICelebrateErrorDetails, IFormattedResponse } from '../interfaces'

interface ResponseHandlerOptions {
  statusCode: number
  data?: any
  message?: string
  error?: any
}

async function responseHandler(res: Response, options: ResponseHandlerOptions) {
  const { statusCode, data, message, error } = options

  try {
    const formattedResponse: IFormattedResponse = {
      code: statusCode,
      message
    }

    if (error instanceof Stripe.errors.StripeError) {
      const sError = error.raw as any
      const stripeError = sError.message

      formattedResponse.message = httpErrorMessageConstant.STRIPE_ERROR
      formattedResponse.error = stripeError
      console.log('Stripe Error: ', formattedResponse.error)
    }

    if (isCelebrateError(error)) {
      const celebrateError = error as CelebrateError
      const errorDetails: ICelebrateErrorDetails[] = []

      celebrateError.details.forEach((value, key) => {
        errorDetails.push({
          message: value.message + ' in ' + key
        })
      })
      formattedResponse.message = httpErrorMessageConstant.VALIDATION_ERROR
      formattedResponse.error = errorDetails
      console.log('Validation Error: ', formattedResponse.error)
    } else {
      if (data !== null && data !== undefined) {
        formattedResponse.data = data
      }

      if (error !== null && error !== undefined && typeof error == 'object') {
        formattedResponse.error = {
          errorMessage: error.message,
          errorObject: error
        }
        if (statusCode != httpStatusConstant.INTERNAL_SERVER_ERROR) {
          loggerUtils.logger.error(error.message)
        }
      }
    }
    return res.status(statusCode).json(formattedResponse)
  } catch (error) {
    console.log('Response Handler Error:', error)
    return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: httpErrorMessageConstant.RESPONSE_HANDLER_ERROR,
      error
    })
  }
}

export default {
  responseHandler
}
