import { Request, Response } from 'express'
import { IUserRoleMapping } from '../../interfaces'
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant'
import { responseHandlerUtils } from '../../utils'
import { HttpError } from '../../libs'
import { User, Role, UserRoleMapping, LibraryBranch } from '../../db/models'
import { UserType, Controller } from '../../types'

/**
 * @description Signs up a new librarian user if it doesn't already exist and assigns the librarian role.
 */
const signupLibrarian: Controller = async (req: Request, res: Response) => {
  const {
    email,
    firstname,
    lastname,
    gender,
    dateOfBirth,
    mobileNumber,
    address,
    city,
    state,
    libraryBranchName
  } = req.body

  let user = await User.findOne({ email, deletedAt: null })
  if (user) {
    throw new HttpError(messageConstant.USER_ALREADY_EXISTS, httpStatusConstant.BAD_REQUEST)
  }

  const libraryBranch = await LibraryBranch.findOne({ name: libraryBranchName, deletedAt: null })
  if (!libraryBranch) {
    throw new HttpError(messageConstant.LIBRARY_BRANCH_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }

  user = await User.create({
    email,
    firstname,
    lastname,
    gender,
    dateOfBirth,
    mobileNumber: BigInt(mobileNumber),
    address,
    city,
    state,
    libraryBranchID: libraryBranch._id // Assign library branch ID to the user
  })

  if (!user) {
    throw new HttpError(
      messageConstant.ERROR_CREATING_USER,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }

  const librarianRole = await Role.findOne({ role: UserType.Librarian, deletedAt: null })
  if (!librarianRole) {
    throw new HttpError(messageConstant.ROLE_NOT_FOUND, httpStatusConstant.INTERNAL_SERVER_ERROR)
  }

  const userRoleMapping: IUserRoleMapping = {
    userID: { _id: user._id, email, firstname, lastname },
    roleID: { _id: librarianRole._id, role: UserType.Librarian }
  }

  await UserRoleMapping.create(userRoleMapping)

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: httpErrorMessageConstant.SUCCESSFUL
  })
}

export default { signupLibrarian }
