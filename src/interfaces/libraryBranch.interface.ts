import { ObjectId } from 'mongoose'

export interface ILibraryBranch {
  _id: ObjectId
  branchID: string
  name: string
  address: string
  phoneNumber: string
  deletedAt: Date
}
