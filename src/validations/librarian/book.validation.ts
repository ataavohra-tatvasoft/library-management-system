import Joi from 'joi'

const addBook = {
  body: Joi.object({
    branchName: Joi.string().required(),
    name: Joi.string().required(),
    authorEmail: Joi.string().email().required(),
    authorFirstName: Joi.string().required(),
    authorLastName: Joi.string().required(),
    authorBio: Joi.string(),
    authorWebsite: Joi.string().uri(),
    authorAddress: Joi.string(),
    charges: Joi.number().required(),
    subscriptionDays: Joi.number().optional().allow(null),
    quantityAvailable: Joi.number().required(),
    description: Joi.string().optional().allow(null)
  })
}

const listBooks = {
  query: Joi.object({
    page: Joi.number().min(1).default(1).optional(),
    pageSize: Joi.number().min(1).default(10).optional()
  })
}

const updateBook = {
  params: Joi.object({
    bookID: Joi.string().required()
  }).required(),
  body: Joi.object({
    name: Joi.string().optional(),
    authorEmail: Joi.string().email().optional(),
    authorFirstName: Joi.string().optional(),
    authorLastName: Joi.string().optional(),
    authorBio: Joi.string().optional(),
    authorWebsite: Joi.string().uri().optional(),
    authorAddress: Joi.string().optional(),
    charges: Joi.number().optional(),
    subscriptionDays: Joi.number().optional().allow(null).optional(),
    quantityAvailable: Joi.number().optional(),
    numberOfFreeDays: Joi.number().optional(),
    description: Joi.string().optional()
  })
}

const deleteBook = {
  params: Joi.object({
    bookID: Joi.string().required()
  }).required()
}

export default { addBook, listBooks, updateBook, deleteBook }
