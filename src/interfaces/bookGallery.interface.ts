import { ObjectId } from 'mongoose'

export interface IBookGallery {
  _id?: ObjectId
  bookID: object
  imagePath: string
  imageName: string
  deletedAt: Date
}
