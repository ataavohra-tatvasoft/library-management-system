import { Schema } from 'mongoose'

export interface IBookReview {
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  review: string
  createdAt: Date
  deletedAt: Date
}
