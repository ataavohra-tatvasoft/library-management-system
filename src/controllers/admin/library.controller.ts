import { Request, Response, NextFunction } from 'express'
import { Controller } from '../../types'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { responseHandlerUtils } from '../../utils'
import { HttpError } from '../../libs'
import { LibraryBranch } from '../../db/models'
import { ICustomQuery } from '../../interfaces'

/**
 * @description Registers a new library branch
 */
const registerNewBranch: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchID, name, address, phoneNumber } = req.body

    const isBranchExists = await LibraryBranch.findOne({
      branchID,
      name,
      phoneNumber,
      deletedAt: null
    })
    if (isBranchExists) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_EXISTS, httpStatusConstant.BAD_REQUEST)
    }

    const newBranch = await LibraryBranch.create({
      branchID,
      name,
      address,
      phoneNumber: BigInt(phoneNumber)
    })

    if (!newBranch) {
      throw new HttpError(
        messageConstant.ERROR_CREATING_LIBRARY_BRANCH,
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
 * @description Retrieves a list of active library branches with essential details.
 */
const getActiveBranchesList: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as unknown as ICustomQuery
    const skip = (page - 1) * pageSize

    const totalBranchesCount = await LibraryBranch.countDocuments({ deletedAt: null })
    if (!totalBranchesCount) {
      throw new HttpError(
        messageConstant.ERROR_COUNTING_LIBRARY_BRANCHES,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    const totalPages = Math.ceil(totalBranchesCount / pageSize)
    if (page > totalPages) {
      throw new HttpError(messageConstant.INVALID_PAGE_NUMBER, httpStatusConstant.BAD_REQUEST)
    }

    const activeBranches = await LibraryBranch.find(
      { deletedAt: null },
      {
        _id: 0,
        name: 1,
        address: 1,
        phoneNumber: 1
      }
    )
      .skip(skip)
      .limit(pageSize)

    if (!activeBranches?.length) {
      throw new HttpError(
        messageConstant.NO_ACTIVE_LIBRARY_BRANCHES_FOUND,
        httpStatusConstant.BAD_REQUEST
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      data: {
        activeBranches,
        pagination: {
          page: page,
          pageSize: pageSize,
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
 * @description Updates library branch information.
 */
const updateBranchDetails: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchID } = req.params
    const { name, address, phoneNumber } = req.body

    const branch = await LibraryBranch.findOne({ branchID, deletedAt: null })
    if (!branch) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const updatedData = {
      ...(name && { name }),
      ...(address && { address }),
      ...(phoneNumber && { phoneNumber: BigInt(phoneNumber) })
    }

    const updatedBranch = await LibraryBranch.findOneAndUpdate(
      { branchID, deletedAt: null },
      updatedData,
      {
        new: true
      }
    )
    if (!updatedBranch) {
      throw new HttpError(
        messageConstant.ERROR_UPDATING_LIBRARY_BRANCH,
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
 * @description Deactivates a library branch account (soft delete).
 */
const deactivateBranch: Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchID } = req.params

    const branch = await LibraryBranch.findOne({ branchID, deletedAt: null })
    if (!branch) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const updatedBranch = await LibraryBranch.findOneAndUpdate(
      { branchID, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!updatedBranch) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_LIBRARY_BRANCH,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.LIBRARY_BRANCH_DELETED_SOFT
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @description Permanently removes a library branch from the system.
 */
const deleteBranchPermanently: Controller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchID } = req.params

    const branch = await LibraryBranch.findOne({ branchID })
    if (!branch) {
      throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const deletedBranch = await LibraryBranch.deleteOne({ branchID })
    if (!deletedBranch) {
      throw new HttpError(
        messageConstant.ERROR_DELETING_LIBRARY_BRANCH,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }

    return responseHandlerUtils.responseHandler(res, {
      statusCode: httpStatusConstant.OK,
      message: messageConstant.LIBRARY_BRANCH_DELETED_HARD
    })
  } catch (error) {
    next(error)
  }
}

export default {
  registerNewBranch,
  getActiveBranchesList,
  updateBranchDetails,
  deactivateBranch,
  deleteBranchPermanently
}
