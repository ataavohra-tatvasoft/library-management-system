import { Model, model, Schema } from 'mongoose'
import { IBookReview } from '../../interfaces' // Assuming you have a User model

type BookReviewModel = Model<IBookReview>

const bookReviewSchema: Schema = new Schema<IBookReview, BookReviewModel>(
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
    review: {
      type: String,
      required: true,
      maxlength: 500 // Set maximum review length
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
bookReviewSchema.index({ bookID: 1, userID: 1 }, { unique: true })
export const BookReview = model<IBookReview, BookReviewModel>('bookreviews', bookReviewSchema)
