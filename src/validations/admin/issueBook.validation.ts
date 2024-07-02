import { Joi } from 'celebrate'

const getIssuedBooksList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const issueBookToUser = {
  body: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim().required(),
    email: Joi.string().email().required(),
    issueDate: Joi.string().isoDate().required()
  })
}

const submitBookForUser = {
  body: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim().required(),
    email: Joi.string().email().required(),
    submitDate: Joi.string().required().isoDate()
  })
}

export default {
  getIssuedBooksList,
  issueBookToUser,
  submitBookForUser
}
