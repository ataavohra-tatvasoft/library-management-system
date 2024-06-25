import { Schema } from 'mongoose'

export interface IPaymentCard {
  cardID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  paymentMethodID: Number
  cardBrand: string
  lastFourDigits: Number
  expirationMonth: Number
  expirationYear: Number
  isDefault: boolean
  deletedAt: Date
}
