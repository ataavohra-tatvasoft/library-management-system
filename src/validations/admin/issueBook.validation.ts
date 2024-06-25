import { Joi } from 'celebrate'

const issueBookList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const issueBook = {
  body: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim().required(),
    email: Joi.string().email().required(),
    issueDate: Joi.string().required().isoDate()
  })
}

const submitBook = {
  body: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim().required(),
    email: Joi.string().email().required(),
    submitDate: Joi.string().required().isoDate()
  })
}

export default {
  issueBookList,
  issueBook,
  submitBook
}
