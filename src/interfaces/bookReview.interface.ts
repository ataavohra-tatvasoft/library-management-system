import { ObjectId, Schema } from 'mongoose'

export interface IBookReview {
  _id?: ObjectId
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  review: string
  deletedAt: Date
}
