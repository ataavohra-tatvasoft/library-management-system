import { UserLibraryBranchMapping } from '../models'
import { ILibraryBranch, IUser, IUserLibraryBranchMapping } from '../../interfaces'
import { loggerUtils } from '../../utils'

export const seedUserLibraryBranchMapping = async (
  insertedUsers: IUser[],
  insertedBranches: ILibraryBranch[]
) => {
  await UserLibraryBranchMapping.deleteMany({})
  loggerUtils.logger.info('Deleted all user role mappings!')
  const userLibraryBranchMappings: IUserLibraryBranchMapping[] = [
    { userID: { _id: insertedUsers[0]._id! }, branchID: { _id: insertedBranches[0]._id! } },
    { userID: { _id: insertedUsers[0]._id! }, branchID: { _id: insertedBranches[1]._id! } },
    { userID: { _id: insertedUsers[1]._id! }, branchID: { _id: insertedBranches[0]._id! } },
    { userID: { _id: insertedUsers[1]._id! }, branchID: { _id: insertedBranches[1]._id! } }
  ]

  await UserLibraryBranchMapping.insertMany(userLibraryBranchMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')
}
