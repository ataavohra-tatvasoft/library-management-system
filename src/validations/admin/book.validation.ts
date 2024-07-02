import { Joi } from 'celebrate'

const addBook = {
  body: Joi.object().keys({
    branchName: Joi.string().required().trim(),
    bookID: Joi.string().required().length(13).trim(),
    name: Joi.string().required().min(3).max(50).trim(),
    author: Joi.string().required().min(3).max(50).trim(),
    charges: Joi.string().required().min(0).trim(),
    subscriptionDays: Joi.string().optional().trim(),
    quantityAvailable: Joi.string().required().trim(),
    description: Joi.string().optional().allow(null, '')
  })
}

const listBooks = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const updateBook = {
  params: {
    bookID: Joi.string().required().length(13)
  },
  body: Joi.object().keys({
    name: Joi.string().optional().trim().allow(''),
    author: Joi.string().optional().trim().allow(''),
    charges: Joi.number().positive().optional().allow(null),
    quantityAvailable: Joi.string().min(0).optional().allow(null),
    subscriptionDays: Joi.string().optional().trim().allow(null),
    numberOfFreeDays: Joi.string().min(0).optional().allow(null),
    description: Joi.string().optional().allow(''),
    branchName: Joi.string().optional().trim().allow('')
  })
}

const deleteBook = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  })
}

const getRatingsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  })
}

const getReviewsSummary = {
  params: Joi.object().keys({
    bookID: Joi.string().required().min(13).max(13).trim()
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).optional().default(10)
  })
}

const importExportBookSpreadSheet = {
  params: Joi.object().keys({
    sheetID: Joi.string().required().trim()
  })
}

export default {
  addBook,
  listBooks,
  updateBook,
  deleteBook,
  getRatingsSummary,
  getReviewsSummary,
  importExportBookSpreadSheet
}
