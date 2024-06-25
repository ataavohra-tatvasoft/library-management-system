import { Joi } from 'celebrate'

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required()
  })
}

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string()
      .min(5)
      .required()
      .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
    confirmPassword: Joi.ref('password'),
    resetToken: Joi.string().required()
  })
}

const signup = {
  body: Joi.object().keys({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com'] }
    }),
    confirmEmail: Joi.ref('email'),
    password: Joi.string()
      .min(5)
      .required()
      .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
    confirmPassword: Joi.ref('password'),
    // typeOfUser: Joi.string().valid('admin', 'user'),
    firstname: Joi.string().max(8).min(3).required(),
    lastname: Joi.string().max(8).min(3).required(),
    dateOfBirth: Joi.string().required(),
    mobileNumber: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    address: Joi.string().max(15).min(5).required(),
    city: Joi.string().min(5).required(),
    state: Joi.string().min(5).required()
  })
}

const updateProfile = {
  params: {
    email: Joi.string().required()
  },

  body: Joi.object().keys({
    password: Joi.string()
      .min(5)
      .optional()
      .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
    confirmPassword: Joi.ref('password'),
    firstname: Joi.string().allow(''),
    lastname: Joi.string().allow(''),
    dateOfBirth: Joi.string().allow(null),
    mobileNumber: Joi.string().allow(null),
    address: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow('')
  })
}

export default {
  login,
  forgotPassword,
  resetPassword,
  signup,
  updateProfile
}
