import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { User } from '../../db/models'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { envConfig } from '../../config'

/**
 * @description Registers a new user (validates age and hashes password).
 */
const addUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
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

    const ageLimitValid = helperFunctionsUtils.validateAgeLimit(dateOfBirth)
    if (!ageLimitValid) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_AGE
      })
    }

    const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
    const hashedPassword = password ? await bcrypt.hash(password, salt) : undefined

    const createUserStatus = await User.create({
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

    if (!createUserStatus) {
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
 * @description Retrieves a list of active users with essential details.
 */
const userList: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page, pageSize } = req.query

    const pageNumber = Number(page) || 1
    const limit = Number(pageSize) || 10
    const skip = (pageNumber - 1) * limit

    const userData = await User.find(
      { deletedAt: null },
      {
        _id: 0,
        email: 1,
        firstname: 1,
        lastname: 1,
        gender: 1,
        dateOfBirth: 1,
        address: 1,
        city: 1,
        state: 1,
        dueCharges: 1
      }
    )
      .skip(skip)
      .limit(limit)

    if (!userData) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.ERROR_LISTING_USER
      })
    }

    const total = await User.countDocuments({ deletedAt: null })
    if (!total) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.OK,
        message: messageConstant.ERROR_COUNTING_USERS
      })
    }

    const totalPages = Math.ceil(total / limit)
    if (pageNumber > totalPages) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.INVALID_PAGE_NUMBER
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        userData,
        pagination: {
          page: pageNumber,
          pageSize: limit,
          totalPages
        }
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Updates user information (optional password update).
 */
const updateUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
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
 * @description Deactivates a user account (soft delete).
 */
const softDeleteUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const userExists = await User.findOne({ email, deletedAt: null })
    if (!userExists) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.USER_NOT_EXISTS
      })
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!updatedUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ERROR_DELETING_USER
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.USER_DELETED_SOFT
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * @description Permanently removes a user from the system.
 */
const hardDeleteUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const userExists = await User.findOne({ email })
    if (!userExists) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.BAD_REQUEST,
        message: messageConstant.USER_NOT_EXISTS
      })
    }

    const deletedUser = await User.deleteOne({ email })
    if (!deletedUser) {
      return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.NOT_FOUND,
        message: messageConstant.ERROR_DELETING_USER
      })
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.USER_DELETED_HARD
    })
  } catch (error) {
    return next(error)
  }
}

export default {
  addUser,
  userList,
  updateUser,
  softDeleteUser,
  hardDeleteUser
}
