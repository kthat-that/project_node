const Joi = require('joi')
const validator = (schema) => (payload)=> schema.validate(payload,{abortEarly:false});

const createEmp = Joi.object({
    gender: Joi.string().min(1).max(50).required(),
    dob: Joi.date().required(),
    phone: Joi.string().min(1).max(50).required(),
    address: Joi.string().min(1).max(50).required(),
    hire_date: Joi.date().required(),
    cv_filename: Joi.string().min(1).max(100).required(),
    base_salary: Joi.number().min(2).max(10).required(),

})

module.exports = {
    validator,
    createEmp,
}


