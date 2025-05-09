const Joi = require('joi');


const validator = (schema) => (payload)=> schema.validate(payload,{abortEarly:false});

const register = Joi.object({
    first_name: Joi.string().min(1).max(50).required(),
    last_name: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    role: Joi.number().valid(1,2,3).required(),
    avatar: Joi.string().pattern(/\.(jpg|jpeg|png)$/i).allow(null, ''),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    gender: Joi.number().valid(1,2).required(),
    dob: Joi.date().iso().required(),
    phone: Joi.string().pattern(/^\d{9,15}$/).required(),
    address: Joi.string().min(4).max(255).required(),
    department_id: Joi.number().integer().required(),
    position_id: Joi.number().integer().required(),
    cv_pdf: Joi.string().allow(null,''),
    hire_date: Joi.date().iso().required(),
    base_salary: Joi.number().required(),
})


const login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
})
const changePass = Joi.object({
    oldPassword:Joi.string().min(8).required(),
    newPassword:Joi.string().min(8).required(),
    confirmPassword:Joi.string().valid(Joi.ref('newPassword')).required()
})
const updateEmp = Joi.object({
    employee_id:Joi.number().required(),
    first_name: Joi.string().min(1).max(50).required(),
    last_name: Joi.string().min(1).max(50).required(),
    avarta: Joi.string().pattern(/\.(jpg|jpeg|png)$/i).allow(null, ''),
    old_img: Joi.string().required(),
    gender: Joi.number().valid(1,2).required(),
    dob: Joi.date().iso().required(),
    phone: Joi.string().pattern(/^\d{9,15}$/).required(),
    address: Joi.string().min(4).max(255).required(),
    department_id: Joi.number().integer().required(),
    position_id: Joi.number().integer().required(),
    hire_date: Joi.date().iso().required(),
    sampleFileNameCv: Joi.string().allow(null,''),
    base_salary: Joi.number().required(),
    old_cv: Joi.string().required(),

})
module.exports ={
    validator,
    register,
    login,
    changePass,
    updateEmp
}