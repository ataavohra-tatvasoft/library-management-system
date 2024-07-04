// seedRoles.ts
import { Role } from '../models'
import { IRole } from '../../interfaces'
import { loggerUtils } from '../../utils'
import { UserType } from '../../types'

export const seedRoles = async () => {
  await Role.deleteMany({})
  loggerUtils.logger.info('Deleted all roles!')

  const roles: IRole[] = [
    {
      role: UserType.User
    },
    {
      role: UserType.Admin
    },
    {
      role: UserType.Librarian
    }
  ]

  const insertedRoles: IRole[] = await Role.insertMany(roles)
  loggerUtils.logger.info('Inserted new roles!')

  return insertedRoles
}
