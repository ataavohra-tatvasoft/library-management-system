import { Joi } from 'celebrate'

const addPaymentCard = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  body: Joi.object().keys({
    cardID: Joi.string().required().trim(),
    cardBrand: Joi.string().required().trim(),
    expirationMonth: Joi.number().required().min(1).max(12),
    expirationYear: Joi.number().required().min(2024),
    cardLastFour: Joi.string().required().trim().length(4),
    token: Joi.string().required().trim()
  })
}

const paymentCardsList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const payCharges = {
  body: Joi.object().keys({
    amount: Joi.number().required().min(1),
    cardID: Joi.string().required().trim(),
    cardBrand: Joi.string().required().trim(),
    expirationMonth: Joi.number().required().min(1).max(12),
    expirationYear: Joi.number().required().min(2024),
    cardLastFour: Joi.string().required().trim().length(4)
  })
}

export default {
  addPaymentCard,
  paymentCardsList,
  payCharges
}
