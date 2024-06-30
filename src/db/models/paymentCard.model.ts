import { Model, model, Schema } from 'mongoose'
import { IPaymentCard } from '../../interfaces' // Assuming you have a User model

type PaymentCardModel = Model<IPaymentCard>

const paymentCardSchema: Schema = new Schema<IPaymentCard, PaymentCardModel>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    cardID: {
      type: String,
      unique: true,
      required: true
    },
    paymentMethodID: {
      type: String,
      required: true
    },
    cardBrand: {
      type: String,
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
    cardLastFour: {
      type: String,
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
