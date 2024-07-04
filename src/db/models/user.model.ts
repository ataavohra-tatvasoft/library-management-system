import { Schema, model, Model } from 'mongoose'
import { IUser } from '../../interfaces'

type UserModel = Model<IUser>

const userSchema: Schema = new Schema<IUser, UserModel>(
  {
    email: { type: String, required: true, unique: true }, // Common field
    password: { type: String, required: false, default: null }, // Common field
    isAuthToken: { type: Boolean, default: false }, // Common field
    firstname: { type: String, required: true }, // Common field
    lastname: { type: String, required: true }, // Common field
    gender: { type: String, enum: ['male', 'female'], required: true }, // Common field
    dateOfBirth: { type: Date }, // Common field
    mobileNumber: { type: BigInt, default: null }, // Common field
    address: { type: String, default: null }, // Common field
    city: { type: String, default: null }, // Common field
    state: { type: String, default: null }, // Common field
    profilePhoto: { type: String, default: null }, // User field
    paidAmount: { type: Number, default: 0, min: 0 }, // User field
    dueCharges: { type: Number, default: 0 }, // User field
    resetToken: { type: String, default: null }, // Common field
    resetTokenExpiry: { type: BigInt, default: null }, // Common field
    stripeCustomerID: { type: String, default: null }, // User field
    cardHolderId: { type: String, default: null }, // User field
    libraryBranchID: {
      type: Schema.Types.ObjectId,
      ref: 'librarybranches',
      allownull: true
    }, // Librarian field
    deletedAt: { type: Date, default: null }, // Common field
    books: [
      // User field
      // Reference to books
      {
        bookId: { type: Schema.Types.ObjectId, ref: 'book', required: true },
        issueDate: { type: Date, default: new Date() },
        _id: false
      }
    ]
  },
  {
    timestamps: true
  }
)

export const User: UserModel = model<IUser, UserModel>('users', userSchema)
