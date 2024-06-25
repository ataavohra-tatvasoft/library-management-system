import { Joi } from 'celebrate'

const addPaymentCard = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  body: Joi.object().keys({
    cardNumber: Joi.string().required().trim().creditCard(),
    cardBrand: Joi.string().required().trim(),
    expirationMonth: Joi.number().required().min(1).max(12),
    expirationYear: Joi.number().required().min(2024),
    cvv: Joi.string().required().trim().length(3),
    token: Joi.string().required().trim()
  })
}

const paymentCardsList = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  })
}

const payCharges = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  body: Joi.object().keys({
    amount: Joi.number().required().min(1),
    cardNumber: Joi.string().required().trim().creditCard(),
    cardBrand: Joi.string().required().trim(),
    expirationMonth: Joi.number().required().min(1).max(12),
    expirationYear: Joi.number().required().min(2024),
    cvv: Joi.string().required().trim().length(3)
  })
}

export default {
  addPaymentCard,
  paymentCardsList,
  payCharges
}
