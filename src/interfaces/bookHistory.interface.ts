import { Schema } from 'mongoose'
export interface IBookHistory {
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  issueDate: Date
  submitDate: Date
  deletedAt: Date
}
