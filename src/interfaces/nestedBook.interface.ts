import { ObjectId } from 'mongoose'

export interface INestedBook {
  bookId: ObjectId
  issueDate: Date
}
