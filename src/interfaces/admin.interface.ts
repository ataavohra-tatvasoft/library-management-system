import { ObjectId } from 'mongoose'

export interface IAdmin {
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
  resetToken: string
  resetTokenExpiry: BigInt
  deletedAt: Date
  createdAt: Date
  updatedAt: Date
}
