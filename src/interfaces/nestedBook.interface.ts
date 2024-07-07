import { ObjectId } from 'mongoose'

export interface INestedBook {
  bookId: ObjectId
  branchID: ObjectId
  issueDate: Date
}
