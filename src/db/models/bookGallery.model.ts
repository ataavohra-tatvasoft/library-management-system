import { Model, Schema, model } from 'mongoose'
import { IBookGallery } from '../../interfaces'

type BookGalleryModel = Model<IBookGallery>
const bookGallerySchema: Schema = new Schema<IBookGallery, BookGalleryModel>(
  {
    bookID: {
      type: Schema.Types.ObjectId,
      ref: 'books',
      required: true
    },
    imagePath: {
      type: String,
      required: true
    },
    imageName: {
      type: String,
      required: true
    },
    deletedAt: {
      type: Date,
      allownull: true,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export const BookGallery = model<IBookGallery, BookGalleryModel>('bookgalleries', bookGallerySchema)
