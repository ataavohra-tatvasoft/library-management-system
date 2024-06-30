import { ObjectId } from 'mongoose'

export interface IBook {
  _id?: ObjectId
  bookID: string
  name: string
  author: string
  charges: number
  issueCount: number
  submitCount: number
  publishedDate: Date
  subscriptionDays: number
  quantityAvailable: number
  numberOfFreeDays: number
  description: string
  deletedAt: Date
  branchID: ObjectId
}
