import { Schema } from 'mongoose'
export interface IBookRating {
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  rating: number
  createdAt: Date
  deletedAt: Date
}
