import { Joi } from 'celebrate'

const registerNewBranch = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(50).required(),
    address: Joi.string().min(5).max(255).required(),
    phoneNumber: Joi.string()
      .pattern(/^\d{10}$/)
      .required()
  })
}

const getActiveBranchesList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const updateBranchDetails = {
  params: {
    branchID: Joi.string().required()
  },

  body: Joi.object()
    .keys({
      name: Joi.string().allow(''),
      address: Joi.string().allow(''),
      phoneNumber: Joi.string().allow(null)
    })
    .min(1)
}

const deactivateDeleteBranch = {
  params: Joi.object().keys({
    branchID: Joi.string().required()
  })
}

export default {
  registerNewBranch,
  getActiveBranchesList,
  updateBranchDetails,
  deactivateDeleteBranch
}
