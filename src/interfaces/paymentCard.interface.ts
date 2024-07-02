import { ObjectId } from 'mongoose'

export interface IPaymentCard {
  _id?: ObjectId
  userID: ObjectId
  cardID: string
  paymentMethodID: string
  cardBrand: string
  expirationMonth: Number
  expirationYear: Number
  cardLastFour: string
  isDefault: boolean
  deletedAt: Date
}
