import { Joi } from 'celebrate'

const signupLibrarian = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dateOfBirth: Joi.date().optional().allow(null),
    mobileNumber: Joi.string().required(),
    address: Joi.string().optional().allow('', null),
    city: Joi.string().optional().allow('', null),
    state: Joi.string().optional().allow('', null),
    libraryBranchName: Joi.string().required()
  })
}

export default { signupLibrarian }
