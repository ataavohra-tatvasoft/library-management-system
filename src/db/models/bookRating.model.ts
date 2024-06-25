import { Model, model, Schema } from 'mongoose'
import { IBookRating } from '../../interfaces' // Assuming you have a User model

type BookRatingModel = Model<IBookRating>

const bookRatingSchema: Schema = new Schema<IBookRating, BookRatingModel>(
  {
    bookID: {
      type: Schema.Types.ObjectId,
      ref: 'books',
      required: true
    },
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now // Set default to current time
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

// Enforce unique rating and review per user for a book
bookRatingSchema.index({ bookID: 1, userID: 1 }, { unique: true })

export const BookRating = model<IBookRating, BookRatingModel>('bookratings', bookRatingSchema)
