import { Joi } from 'celebrate'

const getIssuedBooksList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const issueBookToUser = {
  params: Joi.object().keys({
    bookID: Joi.string().required().length(13).trim()
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    issueDate: Joi.string().isoDate().required(),
    branchID: Joi.string().required()
  })
}

const submitBookForUser = {
  params: Joi.object().keys({
    bookID: Joi.string().required().length(13).trim()
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    submitDate: Joi.string().required().isoDate(),
    branchID: Joi.string().required()
  })
}

export default {
  getIssuedBooksList,
  issueBookToUser,
  submitBookForUser
}
