import { Joi } from 'celebrate';

const searchBook = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional().default(1),
        pageSize: Joi.number().integer().min(1).optional().default(10),
        name: Joi.string().optional().allow('', null).min(3).max(50).trim(),
        bookID: Joi.string().optional().trim(),
    }),
};

const addReview = {
    params: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
    body: Joi.object().keys({
        bookID: Joi.string().required().trim(),
        review: Joi.string().required().min(3).max(500).trim(),
    }),
};

const addRating = {
    params: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
    body: Joi.object().keys({
        bookID: Joi.string().required().trim(),
        rating: Joi.number().required().min(1).max(5),
    }),
};

const issueBookHistory = {
    params: Joi.object().keys({
        email: Joi.string().required().trim(),
    }),
};

const summaryAPI = {
    params: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

export default {
    searchBook,
    addReview,
    addRating,
    issueBookHistory,
    summaryAPI,
};
