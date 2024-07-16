const Joi = require('joi')

const getIssuedBooksList = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10)
  })
}

const issueBookToUser = {
  params: Joi.object({
    bookID: Joi.string().required()
  }),
  body: Joi.object({
    email: Joi.string().email().required(),
    issueDate: Joi.date().iso(),
    branchID: Joi.string().required()
  })
}
const submitBookForUser = {
  params: Joi.object({
    bookID: Joi.string().required()
  }),
  body: Joi.object({
    email: Joi.string().email().required(),
    submitDate: Joi.date().iso(),
    branchID: Joi.string().required()
  })
}

export default { getIssuedBooksList, issueBookToUser, submitBookForUser }
