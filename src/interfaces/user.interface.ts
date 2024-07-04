import { ObjectId } from 'mongoose'
import { INestedBook } from './nestedBook.interface'

export interface IUser {
  _id?: ObjectId
  email: string // Common field
  password: string // Common field
  isAuthToken: boolean // Common field
  firstname?: string // Common field
  lastname?: string // Common field
  gender?: string // Common field
  dateOfBirth?: Date // Common field
  mobileNumber?: bigint // Common field
  address?: string // Common field
  city?: string // Common field
  state?: string // Common field
  profilePhoto?: string // User field
  paidAmount?: number // User field
  dueCharges?: number // User field
  resetToken?: string // Common field
  resetTokenExpiry?: bigint // Common field
  stripeCustomerID?: string // User field
  cardHolderId?: string // User field
  libraryBranchID?: ObjectId //Librarian field
  deletedAt?: Date // Common field
  books?: INestedBook[] // User field
}
