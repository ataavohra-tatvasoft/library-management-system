import { ObjectId } from 'mongoose'

interface IUserID {
  _id: ObjectId
  email?: string
  firstname?: string
  lastname?: string
}

interface IBranchID {
  _id: ObjectId
  branchID?: string
  name?: string
}

export interface IUserLibraryBranchMapping {
  _id?: ObjectId
  userID?: IUserID
  branchID?: IBranchID
  deletedAt?: Date
}
