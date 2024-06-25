import { Joi } from 'celebrate'

const searchBooks = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10),
    name: Joi.string().optional().allow('', null).min(3).max(50).trim(),
    bookID: Joi.string().optional().trim()
  })
}

const addBookReview = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  body: Joi.object().keys({
    bookID: Joi.string().required().trim(),
    review: Joi.string().required().min(3).max(500).trim()
  })
}

const addBookRating = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  body: Joi.object().keys({
    bookID: Joi.string().required().trim(),
    rating: Joi.number().required().min(1).max(5)
  })
}

const getBookIssueHistory = {
  params: Joi.object().keys({
    email: Joi.string().required().trim()
  })
}

const getLibrarySummary = {
  params: Joi.object().keys({
    email: Joi.string().email().required()
  })
}

const getBookRatingsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  })
}

const getBookReviewsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  }),
  query: Joi.object().keys({
    page: Joi.string().min(1).optional().default(1),
    pageSize: Joi.string().min(1).optional().default(10)
  })
}

export default {
  searchBooks,
  addBookReview,
  addBookRating,
  getBookIssueHistory,
  getLibrarySummary,
  getBookRatingsSummary,
  getBookReviewsSummary
}
