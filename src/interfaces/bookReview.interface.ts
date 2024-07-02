import { ObjectId } from 'mongoose'

export interface IBookReview {
  _id?: ObjectId
  bookID: ObjectId
  userID: ObjectId
  review: string
  createdAt: Date
  deletedAt: Date
}
