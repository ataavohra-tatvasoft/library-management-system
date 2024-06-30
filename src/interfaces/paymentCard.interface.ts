import { ObjectId, Schema } from 'mongoose'

export interface IPaymentCard {
  _id?: ObjectId
  userID: Schema.Types.ObjectId
  cardID: string
  paymentMethodID: string
  cardBrand: string
  expirationMonth: Number
  expirationYear: Number
  cardLastFour: string
  isDefault: boolean
  deletedAt: Date
}
