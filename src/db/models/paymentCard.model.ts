import { Model, model, Schema } from 'mongoose'
import { IPaymentCard } from '../../interfaces' // Assuming you have a User model

type PaymentCardModel = Model<IPaymentCard>

const paymentCardSchema: Schema = new Schema<IPaymentCard, PaymentCardModel>(
  {
    cardID: {
      type: Schema.Types.ObjectId,
      required: true
    },
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    paymentMethodID: {
      type: Number,
      required: true
    },
    cardBrand: {
      type: String,
      required: true
    },
    lastFourDigits: {
      type: Number,
      unique: true,
      required: true
    },
    expirationMonth: {
      type: Number,
      required: true
    },
    expirationYear: {
      type: Number,
      required: true
    },
    isDefault: {
      type: Boolean,
      allownull: false,
      default: false
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

export const PaymentCard = model<IPaymentCard, PaymentCardModel>('paymentcards', paymentCardSchema)
