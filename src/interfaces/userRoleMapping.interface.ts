import { ObjectId } from 'mongoose'

interface IUserID {
  _id: ObjectId
  email?: string
  firstname?: string
  lastname?: string
}

interface IRoleID {
  _id: ObjectId
  role?: string
}

export interface IUserRoleMapping {
  _id?: ObjectId
  userID?: IUserID
  roleID?: IRoleID
  deletedAt?: Date
}
