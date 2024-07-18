import { Joi } from 'celebrate'

const addBook = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(50).trim(),
    authorEmail: Joi.string().required().trim().email(),
    authorFirstName: Joi.string().required().min(1).max(10).trim(),
    authorLastName: Joi.string().required().min(1).max(10).trim(),
    authorBio: Joi.string().required().max(500).trim(),
    authorWebsite: Joi.string().optional().trim().allow(''),
    authorAddress: Joi.string().optional().max(200).trim().allow(''),
    charges: Joi.number().positive().required(),
    subscriptionDays: Joi.number().positive().optional().allow(null),
    quantityAvailable: Joi.number().integer().min(0).required(),
    description: Joi.string().optional().allow(null, '').trim()
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
    authorEmail: Joi.string().optional().trim().email(),
    authorFirstName: Joi.string().optional().min(1).max(10).trim(),
    authorLastName: Joi.string().optional().min(1).max(10).trim(),
    authorBio: Joi.string().optional().max(500).trim(),
    authorWebsite: Joi.string().optional().trim().allow(''),
    authorAddress: Joi.string().optional().max(200).trim().allow(''),
    charges: Joi.number().positive().optional().allow(null),
    subscriptionDays: Joi.number().positive().optional().allow(null),
    quantityAvailable: Joi.number().integer().min(0).optional().allow(null),
    numberOfFreeDays: Joi.number().integer().min(0).optional().allow(null),
    description: Joi.string().optional().allow('')
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
  body: Joi.object().keys({
    sheetID: Joi.string().required().trim(),
    sheetname: Joi.string().required().trim()
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
