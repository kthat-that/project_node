const Joi = require('joi');

const validator = (schema) => (payload) => 
schema.validate(payload, {abortEarly: false}); 

const positionSchema = Joi.object({
    name : Joi.string().required(),
    description : Joi.string().required()
});

module.exports = validator(positionSchema);

