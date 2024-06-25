import { Joi } from 'celebrate'

const addBook = {
  body: Joi.object().keys({
    bookID: Joi.string().required().length(13).trim(),
    name: Joi.string().required().min(3).max(50).trim(),
    author: Joi.string().required().min(3).max(50).trim(),
    charges: Joi.string().required().min(0).trim(),
    subscriptionDays: Joi.string().optional().trim(),
    quantityAvailable: Joi.string().required().trim(),
    description: Joi.string().allow(null, '')
  })
}

const bookList = {
  query: Joi.object().keys({
    page: Joi.string().min(1).optional().default(1),
    pageSize: Joi.string().min(1).optional().default(10)
  })
}

const updateBook = {
  params: {
    bookID: Joi.string().required().length(13)
  },
  body: Joi.object().keys({
    name: Joi.string().optional().allow(''),
    author: Joi.string().optional().allow(''),
    charges: Joi.number().positive().optional().allow(null),
    quantityAvailable: Joi.string().min(0).optional().allow(null),
    subscriptionDays: Joi.string().optional().trim(),
    numberOfFreeDays: Joi.string().min(0).optional().allow(null),
    description: Joi.string().optional().allow('')
  })
}

const deleteBook = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  })
}

const ratingsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  })
}

const reviewsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  }),
  query: Joi.object().keys({
    page: Joi.string().min(1).optional().default(1),
    pageSize: Joi.string().min(1).optional().default(10)
  })
}

export default {
  addBook,
  bookList,
  updateBook,
  deleteBook,
  ratingsSummary,
  reviewsSummary
}
