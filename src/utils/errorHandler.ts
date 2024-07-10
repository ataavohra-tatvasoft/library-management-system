import { Request, Response, NextFunction } from 'express'
import responseHandlerUtils from './responseHandler.utils'
import { httpStatusConstant } from '../constant'
import { HttpError } from '../libs'

// eslint-disable-next-line no-unused-vars
const errorHandler = (error: HttpError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || httpStatusConstant.INTERNAL_SERVER_ERROR
  return responseHandlerUtils.responseHandler(res, {
    statusCode,
    message: error.message,
    error
  })
}

export default {
  errorHandler
}
