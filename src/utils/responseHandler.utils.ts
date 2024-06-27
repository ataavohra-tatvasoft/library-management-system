import { Response } from 'express'
import { CelebrateError, isCelebrateError } from 'celebrate'
import { loggerUtils } from '../utils'
import { httpErrorMessageConstant, httpStatusConstant } from '../constant'

interface ResponseHandlerOptions {
  statusCode: number
  data?: any
  message?: string
  error?: any
}

async function responseHandler(res: Response, options: ResponseHandlerOptions) {
  const { statusCode, data, message, error } = options

  try {
    const formattedResponse: any = {
      code: statusCode,
      message
    }
    if (isCelebrateError(error)) {
      const celebrateError = error as CelebrateError
      const errorDetails: any[] = []

      celebrateError.details.forEach((value, key) => {
        errorDetails.push({
          message: value.message + ' in ' + key
        })
      })
      formattedResponse.message = httpErrorMessageConstant.VALIDATION_ERROR
      formattedResponse.error = errorDetails
      loggerUtils.logger.error(formattedResponse.error)
    } else {
      if (data !== null && data !== undefined) {
        formattedResponse.data = data
      }
      if (error !== null && error !== undefined && typeof error == 'object') {
        formattedResponse.error = {
          errorMessage: error.message,
          errorObject: error
        }
        loggerUtils.logger.error(error.message)
      }
    }

    return res.status(statusCode).json(formattedResponse)
  } catch (error) {
    loggerUtils.logger.error('Response Handler Error:', error)
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
