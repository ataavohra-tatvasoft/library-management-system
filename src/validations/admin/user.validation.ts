import { Joi } from 'celebrate'

const addUser = {
  body: Joi.object().keys({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com'] }
    }),
    confirmEmail: Joi.ref('email'),
    password: Joi.string()
      .min(5)
      .optional()
      .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
    confirmPassword: Joi.ref('password'),
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

const userList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const updateUser = {
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

const deleteUser = {
  params: Joi.object().keys({
    email: Joi.string().required()
  })
}

export default {
  addUser,
  userList,
  updateUser,
  deleteUser
}
