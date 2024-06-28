import { ObjectId, Schema } from 'mongoose'

export interface IPaymentCard {
  _id?: ObjectId
  userID: Schema.Types.ObjectId
  paymentMethodID: string
  cardBrand: string
  lastFourDigits: string
  expirationMonth: Number
  expirationYear: Number
  cvv: Number
  isDefault: boolean
  deletedAt: Date
}
