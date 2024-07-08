import { ObjectId } from 'mongoose'
import { UserType } from '../types'

export interface IRole {
  _id?: ObjectId
  role: UserType
  deletedAt?: Date
}
