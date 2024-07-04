import { ObjectId } from 'mongoose'

export interface IAuthor {
  _id?: ObjectId
  firstname: string
  lastname: string
  bio: string
  website?: string
  email?: string
  address?: string
}
