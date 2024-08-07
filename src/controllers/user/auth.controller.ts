import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { User } from '../../db/models'
import { Controller } from '../../types'
import {
  authUtils,
  ejsCompilerUtils,
  helperFunctionsUtils,
  responseHandlerUtils,
  sendMailUtils
} from '../../utils'
import { envConfig } from '../../config'
import { HttpError } from '../../libs'

/**
 * @description Authenticates user and generates JWT token upon successful login.
 */
const login: Controller = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email, deletedAt: null })
  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new HttpError(messageConstant.INVALID_PASSWORD, httpStatusConstant.UNAUTHORIZED)
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

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    data: {
      accessToken,
      refreshToken
    },
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Refreshes user access token upon valid refresh token verification.
 */
const generateNewAccessToken: Controller = async (req: Request, res: Response) => {
  const { token } = await authUtils.validateAuthorizationHeader(req.headers)

  const redisClient = await authUtils.createRedisClient()
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const blockedListKey = `blocked:refresh:tokens`

  const isBlocked = await redisClient.sIsMember(blockedListKey, hashedToken)
  if (isBlocked) {
    throw new HttpError(httpErrorMessageConstant.TOKEN_BLACKLISTED, httpStatusConstant.UNAUTHORIZED)
  }

  const validatedToken = await authUtils.verifyRefreshToken(token)
  if (!(validatedToken.tokenType === 'refresh')) {
    throw new HttpError(messageConstant.INVALID_TOKEN_TYPE, httpStatusConstant.INVALID_TOKEN)
  }

  const user = await User.findOne({ email: validatedToken.email, deletedAt: null })

  const newAccessToken = jwt.sign(
    {
      _id: user?._id,
      email: user?.email,
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
}

/**
 * @description Logs out user by invalidating JWT tokens.
 */
const logout: Controller = async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body

  await authUtils.verifyAccessToken(accessToken)
  await authUtils.verifyRefreshToken(refreshToken)

  await authUtils.blockToken(accessToken, 'access')
  await authUtils.blockToken(refreshToken, 'refresh')

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Initiates user password reset by email.
 */
const forgotPassword: Controller = async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await User.findOne({ email, deletedAt: null })
  if (!user) {
    throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  const resetToken = crypto.createHash('sha256').update(email).digest('hex')
  const expireTime = Date.now() + 60 * 60 * 1000 // 1 hour

  const updateUser = await User.updateOne({ email }, { resetToken, resetTokenExpiry: expireTime })
  if (!updateUser) {
    throw new HttpError(
      messageConstant.ERROR_UPDATING_USER,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }

  const data = { link: envConfig.resetPassLink }
  const html = await ejsCompilerUtils.compileTemplate('resetPassword', data)

  await sendMailUtils.sendEmail({ to: email, subject: 'Reset Password Link', html })

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Resets user password using valid reset token.
 */
const resetPassword: Controller = async (req: Request, res: Response) => {
  const { password, resetToken } = req.body

  const user = await User.findOne({
    resetToken,
    resetTokenExpiry: { $gt: Date.now() },
    deletedAt: null
  })
  if (!user) {
    throw new HttpError(messageConstant.INVALID_RESET_TOKEN, httpStatusConstant.NOT_FOUND)
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
    throw new HttpError(
      messageConstant.ERROR_UPDATING_USER,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Registers a new user.
 */
const registerNewUser: Controller = async (req: Request, res: Response) => {
  const {
    email,
    password,
    firstname,
    lastname,
    dateOfBirth,
    mobileNumber,
    gender,
    address,
    city,
    state
  } = req.body

  const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
  const hashedPassword = await bcrypt.hash(password, salt)

  const isAgeValid = helperFunctionsUtils.validateAgeLimit(dateOfBirth)
  if (!isAgeValid) {
    throw new HttpError(messageConstant.INVALID_AGE, httpStatusConstant.BAD_REQUEST)
  }

  const signupStatus = await User.create({
    email,
    password: hashedPassword,
    firstname,
    lastname,
    dateOfBirth: new Date(dateOfBirth),
    mobileNumber: BigInt(mobileNumber),
    gender,
    address,
    city,
    state,
    deletedAt: null
  })
  if (!signupStatus) {
    throw new HttpError(messageConstant.ERROR_SIGNING_USER, httpStatusConstant.BAD_REQUEST)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Updates user profile information.
 */
const updateUserProfile: Controller = async (req: Request, res: Response) => {
  const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
    req.body

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

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

  const updatedUser = await User.findOneAndUpdate(
    { email: req.user.email, deletedAt: null },
    updateData,
    {
      new: true
    }
  )
  if (!updatedUser) {
    throw new HttpError(
      messageConstant.ERROR_UPDATING_USER,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

/**
 * @description Uploads user profile photo.
 */
const uploadUserProfilePhoto: Controller = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(messageConstant.FILE_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
  }

  const profilePhotoPath = req.file.path

  const uploadFile = await User.findOneAndUpdate(
    { email: req.user.email, deletedAt: null },
    {
      profilePhoto: profilePhotoPath
    },
    { new: true }
  )

  if (!uploadFile) {
    throw new HttpError(messageConstant.ERROR_UPLOAD_FILE, httpStatusConstant.BAD_REQUEST)
  }

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

export default {
  login,
  generateNewAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  registerNewUser,
  updateUserProfile,
  uploadUserProfilePhoto
}
