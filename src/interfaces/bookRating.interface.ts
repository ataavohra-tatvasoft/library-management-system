import { ObjectId, Schema } from 'mongoose'
export interface IBookRating {
  _id?: ObjectId
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  rating: number
  deletedAt: Date
}
