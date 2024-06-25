import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { Admin } from '../../db/models'
import { authUtils, ejsCompilerUtils, sendMailUtils } from '../../utils'
import { Controller } from '../../interfaces'
import { envConfig } from '../../config'
import responseHandlerUtils from '../../utils/responseHandler.utils'

/**
 * @description Authenticates admin using email/password and returns JWT token (if valid).
 */
const login: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    const admin = await Admin.findOne({ email, deletedAt: null })
    if (!admin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ADMIN_NOT_FOUND
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password)
    if (!isPasswordCorrect) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.UNAUTHORIZED,
        message: messageConstant.INVALID_PASSWORD
      })
    }

    const accessToken = jwt.sign(
      {
        _id: admin._id,
        email: admin.email,
        tokenType: 'access'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: String(envConfig.accessTokenExpiresIn)
      }
    )

    const refreshToken = jwt.sign(
      {
        _id: admin._id,
        email: admin.email,
        tokenType: 'refresh'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: String(envConfig.refreshTokenExpiresIn)
      }
    )

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: { accessToken, refreshToken },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Refreshes user access token upon valid refresh token verification.
 */
const generateNewAccessToken: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)

    const redisClient = await authUtils.createRedisClient()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const key = `blocked:refresh:tokens` // Customize key prefix (access or refresh)

    const isTokenBlocked = await redisClient.sIsMember(key, hashedToken)
    if (isTokenBlocked) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.UNAUTHORIZED,
        message: httpErrorMessageConstant.TOKEN_BLACKLISTED
      })
    }

    const validatedToken = await authUtils.verifyRefreshToken(token)
    if (validatedToken.tokenType !== 'refresh') {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INVALID_TOKEN,
        message: messageConstant.INVALID_TOKEN_TYPE
      })
    }

    const admin = await Admin.findOne({ email: validatedToken.email })
    if (!admin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ADMIN_NOT_FOUND
      })
    }

    const newAccessToken = jwt.sign(
      {
        _id: admin._id,
        email: admin.email,
        tokenType: 'access'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    )

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: { newAccessToken },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Validates JWT token and logs out admin.
 */
const logout: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken } = req.body

    // Verify the JWT tokens
    await authUtils.verifyAccessToken(accessToken)
    await authUtils.verifyRefreshToken(refreshToken)

    // Block the tokens
    await authUtils.blockToken(accessToken, 'access')
    await authUtils.blockToken(refreshToken, 'refresh')

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Initiates admin password reset by email.
 */
const forgotPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body

    const admin = await Admin.findOne({ email, deletedAt: null })
    if (!admin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ADMIN_NOT_FOUND
      })
    }

    const resetToken = crypto.createHash('sha256').update(email).digest('hex')
    const expireTime = Date.now() + 60 * 60 * 1000 // 1 hour

    const updateAdmin = await Admin.updateOne(
      { email },
      { resetToken, resetTokenExpiry: expireTime }
    )
    if (!updateAdmin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_ADMIN
      })
    }
    const data = { link: envConfig.resetPassLink }
    const html = await ejsCompilerUtils.compileEmailTemplate('resetPassword', data)

    await sendMailUtils.sendEmail({ to: email, subject: 'Reset Password Link', html })

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Resets admin password using valid reset token.
 */
const resetPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, resetToken } = req.body

    const admin = await Admin.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
      deletedAt: null
    })

    if (!admin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.INVALID_RESET_TOKEN
      })
    }

    const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
    const hashedPassword = await bcrypt.hash(password, salt)

    const updateAdmin = await Admin.updateOne(
      { _id: admin._id },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    )
    if (!updateAdmin) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_ADMIN
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Updates admin profile information.
 */
const updateAdminProfile: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params
    const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
      req.body || {}
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

    const adminProfile = await Admin.findOne({ email })

    if (!adminProfile) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ADMIN_NOT_FOUND
      })
    }

    const updatedAdminData = {
      ...(hashedPassword && { password: hashedPassword }),
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }), // Assuming dateOfBirth is a string
      ...(mobileNumber && { mobileNumber: BigInt(mobileNumber) }), // Assuming mobileNumber is a bigint
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state })
    }

    // Update admin profile and return the updated document
    const updatedProfile = await Admin.findOneAndUpdate({ email }, updatedAdminData, { new: true })

    if (!updatedProfile) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_PROFILE
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

export default {
  login,
  generateNewAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  updateAdminProfile
}
