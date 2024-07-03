import { ObjectId } from 'mongoose'
import { INestedBook } from './nestedBook.interface'

export interface IUser {
  _id?: ObjectId
  email: string
  password: string
  isAuthToken: boolean
  firstname: string
  lastname: string
  gender: string
  dateOfBirth: Date
  mobileNumber: BigInt
  address: string
  city: string
  state: string
  profilePhoto: string
  paidAmount: Number
  dueCharges: Number
  resetToken: string
  resetTokenExpiry: BigInt
  stripeCustomerID: string
  cardHolderId: string
  deletedAt: Date
  books: INestedBook[]
}
