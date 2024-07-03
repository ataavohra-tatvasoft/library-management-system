import { Model, model, Schema } from 'mongoose'
import { IUser } from '../../interfaces'

type UserModel = Model<IUser>

const userSchema: Schema = new Schema<IUser, UserModel>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false, allownull: true },
    isAuthToken: {
      type: Boolean,
      allownull: false,
      default: false
    },
    firstname: { type: String },
    lastname: { type: String },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: {
      type: Date
    },
    mobileNumber: {
      type: BigInt,
      allownull: false
    },
    address: {
      type: String,
      allownull: true
    },
    city: {
      type: String,
      allownull: true
    },
    state: {
      type: String,
      allownull: true
    },
    profilePhoto: {
      type: String,
      allownull: true
    },
    paidAmount: {
      type: Number,
      allownull: false,
      default: 0,
      min: 0
    },
    dueCharges: {
      type: Number,
      allownull: false,
      default: 0
    },
    resetToken: {
      type: String,
      allownull: true
    },
    resetTokenExpiry: {
      type: BigInt,
      allownull: true
    },
    stripeCustomerID: {
      type: String,
      allownull: true
    },
    cardHolderId: {
      type: String,
      allownull: true
    },
    deletedAt: {
      type: Date,
      allownull: true,
      default: null
    },
    // Reference to books
    books: [
      {
        bookId: { type: Schema.Types.ObjectId, ref: 'book', required: true },
        issueDate: {
          type: Date,
          required: true,
          allownull: false,
          default: new Date()
        },
        _id: false
      }
    ]
  },
  {
    timestamps: true
  }
)

export const User: UserModel = model<IUser, UserModel>('users', userSchema)
