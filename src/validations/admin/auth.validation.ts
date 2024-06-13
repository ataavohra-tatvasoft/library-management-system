import { Joi } from 'celebrate';

const login = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

const resetPassword = {
    body: Joi.object().keys({
        password: Joi.string()
            .min(5)
            .required()
            .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
        confirmPassword: Joi.ref('password'),
        resetToken: Joi.string().required(),
    }),
};

const updateProfile = {
    params: {
        email: Joi.string().required(),
    },

    body: Joi.object().keys({
        password: Joi.string()
            .min(5)
            .required()
            .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=?{|}\[\]:\'\";,.<>\/\\|\s]).+$/),
        confirmPassword: Joi.ref('password'),
        firstname: Joi.string().allow(''),
        lastname: Joi.string().allow(''),
        dateOfBirth: Joi.string().allow(null),
        mobileNumber: Joi.string().allow(null),
        address: Joi.string().allow(''),
        city: Joi.string().allow(''),
        state: Joi.string().allow(''),
    }),
};

export default {
    login,
    forgotPassword,
    resetPassword,
    updateProfile,
};
