import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { User } from '../db/models'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../constant'
import { authUtils } from '../utils'
import { HttpError } from '../libs'

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const radisClient = await authUtils.createRedisClient()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const key = `blocked:access:tokens`

    const isBlocked = await radisClient.sIsMember(key, hashedToken)
    if (isBlocked) {
      return res.status(httpStatusConstant.UNAUTHORIZED).json({
        status: false,
        message: httpErrorMessageConstant.TOKEN_BLACKLISTED
      })
    }
    const verifiedToken = await authUtils.verifyAccessToken(token)
    if (!(verifiedToken.tokenType == 'access')) {
      return res.status(httpStatusConstant.INVALID_TOKEN).json({
        status: false,
        message: messageConstant.INVALID_TOKEN_TYPE
      })
    }

    const user = await User.findOne({ email: verifiedToken.email, deletedAt: null })
    if (!user) {
      return res.status(httpStatusConstant.NOT_FOUND).json({
        status: false,
        message: messageConstant.USER_NOT_FOUND + ' or Invalid Token'
      })
    }
    next()
  } catch (error) {
    return next(error)
  }
}

const uploadProfilePhotoAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)
    const verifiedToken = await authUtils.verifyAccessToken(token)

    if (verifiedToken?.email != email) {
      throw new HttpError(httpErrorMessageConstant.UNAUTHORIZED, httpStatusConstant.UNAUTHORIZED)
    }
    next()
  } catch (error) {
    return next(error)
  }
}

export default {
  authMiddleware,
  uploadProfilePhotoAuth
}
