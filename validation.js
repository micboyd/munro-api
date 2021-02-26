const Joi = require('@hapi/joi');

// Register validation

const registerValidation = (data) => {
    const schema = {
        firstname: Joi.string().min(1).required(),
        surname: Joi.string().min(1).required(),
        isAdmin: Joi.bool().required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    }

    return Joi.validate(data, schema);
}

const loginValidation = (data) => {
    const schema = {
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    }

    return Joi.validate(data, schema);
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;