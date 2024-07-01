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
  body: Joi.object().keys({
    bookID: Joi.string().required().trim(),
    review: Joi.string().required().min(3).max(500).trim()
  })
}

const addBookRating = {
  body: Joi.object().keys({
    bookID: Joi.string().required().trim(),
    rating: Joi.number().required().min(1).max(5)
  })
}

const getBookRatingsSummary = {
  params: Joi.object().keys({
    bookID: Joi.number().min(13).required()
  })
}

const getBookReviewsSummary = {
  params: Joi.object().keys({
    bookID: Joi.number().min(13).required()
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const getReport = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    monthYear: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional()
  })
}

export default {
  searchBooks,
  addBookReview,
  addBookRating,
  getBookRatingsSummary,
  getBookReviewsSummary,
  getReport
}
