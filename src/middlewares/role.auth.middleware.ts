import { Request, Response, NextFunction } from 'express'
import { User, UserRoleMapping } from '../db/models'
import { UserType } from '../types'
import { authUtils } from '../utils'
import { httpStatusConstant, messageConstant } from '../constant'
import { HttpError } from '../libs'

const checkUserRole =
  (requiredRole: UserType) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = await authUtils.validateAuthorizationHeader(req.headers)
      const verifiedToken = await authUtils.verifyAccessToken(token)

      const user = await User.findOne({ email: verifiedToken.email, deletedAt: null })
      if (!user) {
        return res.status(httpStatusConstant.NOT_FOUND).json({
          status: false,
          message: `${requiredRole} not found or Invalid Token `
        })
      }

      const userRoleMappings = await UserRoleMapping.find({ userID: verifiedToken._id }).populate(
        'roleID'
      )

      if (!userRoleMappings || userRoleMappings.length === 0) {
        throw new HttpError(
          messageConstant.USER_ROLE_MAPPING_NOT_FOUND,
          httpStatusConstant.ACCESS_FORBIDDEN
        )
      }

      let hasRequiredRole = false
      for (const userRole of userRoleMappings) {
        if (userRole.roleID && userRole.roleID.role === requiredRole) {
          hasRequiredRole = true
          break
        }
      }

      if (!hasRequiredRole) {
        throw new HttpError(
          messageConstant.USER_DOES_NOT_HAVE_REQUIRED_ROLE,
          httpStatusConstant.ACCESS_FORBIDDEN
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }

export default { checkUserRole }
