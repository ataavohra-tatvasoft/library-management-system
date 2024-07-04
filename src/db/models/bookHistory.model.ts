import { Model, Schema, model } from 'mongoose'
import { IBookHistory } from '../../interfaces'

type BookHistoryModel = Model<IBookHistory>
const bookHistorySchema: Schema = new Schema<IBookHistory, BookHistoryModel>(
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
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      allownull: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    submitDate: {
      type: Date,
      allownull: true,
      default: null
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

export const BookHistory = model<IBookHistory, BookHistoryModel>('bookhistories', bookHistorySchema)
