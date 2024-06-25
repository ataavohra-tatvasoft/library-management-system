import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { User } from '../../db/models'
import { Controller } from '../../interfaces'
import {
  authUtils,
  ejsCompilerUtils,
  helperFunctionsUtils,
  responseHandlerUtils,
  sendMailUtils
} from '../../utils'
import { envConfig } from '../../config'

/**
 * @description Authenticates user and generates JWT token upon successful login.
 */
const login: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email, deletedAt: null })
    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.UNAUTHORIZED,
        message: messageConstant.INVALID_PASSWORD
      })
    }

    const accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        tokenType: 'access'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: String(envConfig.accessTokenExpiresIn)
      }
    )

    const refreshToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        tokenType: 'refresh'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: String(envConfig.refreshTokenExpiresIn)
      }
    )

    const updateUser = await User.updateOne({ email: user.email }, { refreshToken })
    if (!updateUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_USER
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        accessToken,
        refreshToken
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Refreshes user access token upon valid refresh token verification.
 */
const newAccessToken: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = await authUtils.validateAuthorizationHeader(req.headers)

    const radisClient = await authUtils.createRedisClient()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const key = `blocked:refresh:tokens`

    const isBlocked = await radisClient.sIsMember(key, hashedToken)
    if (isBlocked) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.UNAUTHORIZED,
        message: httpErrorMessageConstant.TOKEN_BLACKLISTED
      })
    }

    const verifiedToken = await authUtils.verifyRefreshToken(token)
    if (!(verifiedToken.tokenType == 'refresh')) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INVALID_TOKEN,
        message: messageConstant.INVALID_TOKEN_TYPE
      })
    }

    const user = await User.findOne({ email: verifiedToken.email })
    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    const newAccessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        tokenType: 'access'
      },
      String(envConfig.jwtSecretKey),
      {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    )

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        accessToken: newAccessToken
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Validates JWT token and logs out user.
 */
const logout: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken } = req.body

    // Verify the JWT tokens
    await authUtils.verifyRefreshToken(refreshToken)
    await authUtils.verifyAccessToken(accessToken)

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
 * @description Initiates user password reset by email.
 */
const forgotPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email, deletedAt: null })
    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    const resetToken = crypto.createHash('sha256').update(email).digest('hex')
    const expireTime = Date.now() + 60 * 60 * 1000 // 1 hour

    const updateUser = await User.updateOne({ email }, { resetToken, resetTokenExpiry: expireTime })
    if (!updateUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_USER
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
 * @description Resets user password using valid reset token.
 */
const resetPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, resetToken } = req.body

    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
      deletedAt: null
    })

    if (!user) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.INVALID_RESET_TOKEN
      })
    }

    const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
    const hashedPassword = await bcrypt.hash(password, salt)

    const updateUser = await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    )
    if (!updateUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_USER
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
 * @description Registers a new user (validates age and hashes password).
 */
const signup: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      email,
      password,
      firstname,
      lastname,
      dateOfBirth,
      mobileNumber,
      address,
      city,
      state
    } = req.body

    const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
    const hashedPassword = await bcrypt.hash(password, salt)

    const ageLimitValid = helperFunctionsUtils.validateAgeLimit(dateOfBirth)
    if (!ageLimitValid) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_AGE
      })
    }

    const signupStatus = await User.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      dateOfBirth: new Date(dateOfBirth),
      mobileNumber: BigInt(mobileNumber),
      address,
      city,
      state
    })

    if (!signupStatus) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_SIGNING_USER
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
 * @description Updates user information (optional password update).
 */
const updateProfile: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params
    const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
      req.body || {}

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

    const userProfile = await User.findOne({ email })
    if (!userProfile) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    const updateData = {
      ...(hashedPassword && { password: hashedPassword }),
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(mobileNumber && { mobileNumber: BigInt(mobileNumber) }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state })
    }

    const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true })
    if (!updatedUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        message: messageConstant.ERROR_UPDATING_USER
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
 * @description Uploads user profile photo.
 */
const uploadProfilePhoto: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const exists = await User.findOne({ email })
    if (!exists) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.USER_NOT_FOUND
      })
    }

    if (!req.file) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.FILE_NOT_UPLOADED
      })
    }

    const profilePhotoPath = req.file.path

    const uploadFile = await User.findOneAndUpdate(
      { email },
      {
        profilePhoto: profilePhotoPath
      },
      { new: true }
    )

    if (!uploadFile) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_UPLOAD_FILE
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
  newAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  signup,
  updateProfile,
  uploadProfilePhoto
}
