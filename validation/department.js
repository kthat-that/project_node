const Joi = require('joi');

const validator = (schema) => (payload) => 
schema.validate(payload, {abortEarly: false}); 

const departmentSchema = Joi.object({
    name : Joi.string().required(),
});

module.exports = validator(departmentSchema);

