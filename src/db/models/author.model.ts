import { Model, model, Schema } from 'mongoose'
import { IAuthor } from '../../interfaces'

type AuthorModel = Model<IAuthor>

const authorSchema: Schema = new Schema<IAuthor, AuthorModel>(
  {
    email: {
      type: String,
      trim: true,
      unique: true
    },
    firstname: {
      type: String,
      required: true,
      trim: true
    },
    lastname: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      required: true,
      maxlength: 500
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200
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

export const Author: AuthorModel = model<IAuthor, AuthorModel>('authors', authorSchema)
