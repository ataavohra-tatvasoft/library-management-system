import { ObjectId } from 'mongoose'
export interface IBookRating {
  _id?: ObjectId
  bookID: ObjectId
  userID: ObjectId
  rating: number
  createdAt: Date
  deletedAt: Date
}
