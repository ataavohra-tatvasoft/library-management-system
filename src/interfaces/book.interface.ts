import { ObjectId } from 'mongoose'

interface IAuthorID {
  _id?: ObjectId
  firstname: string
  lastname: string
  bio: string
  website?: string
  email?: string
  address?: string
}
export interface IBook {
  _id?: ObjectId
  bookID: string
  name: string
  author?: IAuthorID | ObjectId
  charges: number
  issueCount: number
  submitCount: number
  publishedDate: Date
  subscriptionDays: number
  quantityAvailable: number
  numberOfFreeDays: number
  description: string
  deletedAt: Date
}
