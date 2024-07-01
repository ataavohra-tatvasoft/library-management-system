import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { User } from '../../db/models'
import { Controller } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { helperFunctionsUtils, responseHandlerUtils } from '../../utils'
import { envConfig } from '../../config'
import { HttpError } from '../../libs'
import { ICustomQuery } from '../../interfaces/query.interface'

/**
 * @description Registers a new user (validates age and hashes password).
 */
const registerUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
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

    const isAgeValid = helperFunctionsUtils.validateAgeLimit(dateOfBirth)
    if (!isAgeValid) {
      throw new HttpError(messageConstant.INVALID_AGE, httpStatusConstant.BAD_REQUEST)
    }

    const salt = await bcrypt.genSalt(Number(envConfig.saltRounds))
    const hashedPassword = password ? await bcrypt.hash(password, salt) : undefined

    const newUser = await User.create({
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

    if (!newUser) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_USER,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Retrieves a list of active users with essential details.
 */
const getActiveUsersList: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { page, pageSize } = req.query as unknown as ICustomQuery

    const pageNumber = page || 1
    const limit = pageSize || 10
    const skip = (pageNumber - 1) * limit

    const totalUsersCount = await User.countDocuments({ deletedAt: null })
    if (!totalUsersCount) {
      throw new HttpError(
        messageConstant.ERROR_COUNTING_USERS,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const totalPages = Math.ceil(totalUsersCount / limit)
    if (pageNumber > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }
    const activeUsers = await User.find(
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

    if (!activeUsers?.length) {
      throw new HttpError(messageConstant.NO_ACTIVE_USERS_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        activeUsers,
        pagination: {
          page: pageNumber,
          pageSize: limit,
          totalPages
        }
      },
      message: httpErrorMessageConstant.SUCCESSFUL
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Updates user information (optional password update).
 */
const updateUserDetails: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params
    const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
      req.body || {}
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const updatedData = {
      ...(hashedPassword && { password: hashedPassword }),
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(mobileNumber && { mobileNumber: BigInt(mobileNumber) }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state })
    }

    const updatedUser = await User.findOneAndUpdate({ email }, updatedData, { new: true })
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
  } catch (error) {
    next(error)
  }
}

/**
 * @description Deactivates a user account (soft delete).
 */
const deactivateUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email, deletedAt: null })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!updatedUser) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_USER,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.USER_DELETED_SOFT
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Permanently removes a user from the system.
 */
const deleteUserPermanently: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email })
    if (!user) {
      throw new HttpError(messageConstant.USER_NOT_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const deletedUser = await User.deleteOne({ email })
    if (!deletedUser) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_USER,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.USER_DELETED_HARD
    })
  } catch (error) {
    next(error)
  }
}

export default {
  registerUser,
  getActiveUsersList,
  updateUserDetails,
  deactivateUser,
  deleteUserPermanently
}
