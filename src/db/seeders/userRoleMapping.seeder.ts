import { UserRoleMapping } from '../models'
import { IRole, IUser, IUserRoleMapping } from '../../interfaces'
import { loggerUtils } from '../../utils'

export const seedUserRoleMapping = async (insertedRoles: IRole[], insertedUsers: IUser[]) => {
  await UserRoleMapping.deleteMany({})
  loggerUtils.logger.info('Deleted all user role mappings!')
  const userRoleMappings: IUserRoleMapping[] = [
    { userID: insertedUsers[0]._id, roleID: insertedRoles[0]._id },
    { userID: insertedUsers[1]._id, roleID: insertedRoles[1]._id }
  ]

  await UserRoleMapping.insertMany(userRoleMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')
}
