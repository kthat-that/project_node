const con = require('../config/db')
const util = require('util');
const { validator, createEmp } = require('../validation/auth');

// Promisify the query function
const query = util.promisify(con.query).bind(con);

const getAllEmployees = async () => {
    const sql = `
        SELECT 
            employees.id,
            CONCAT(users.first_name, users.last_name) AS fullname, 
            employees.gender,
            employees.dob,
            employees.phone,
            employees.address,
            departments.name AS department_name,
            positions.name AS position_name,
            employees.hire_date,
            employees.base_salary
        FROM employees  
        INNER JOIN users ON users.id = employees.user_id
        INNER JOIN departments ON departments.id = employees.department_id
        INNER JOIN positions ON positions.id = employees.position_id;
    `;
    return await query(sql);
};

const getAllUsers = async () => { 
    const sql = "SELECT * FROM users";
    return await query(sql);
};


const createEmployee = async (employeeData) => {
     //* validation 
     const { error, value } = validator(createEmp)(req.body);
     if (error) {
         return res.status(400).json({
             message: 'All fields are required!',
             details: error.message
         });
     }
    const sql = `
        INSERT INTO employees 
        (user_id, gender, dob, phone, address, department_id, position_id, hire_date, base_salary) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
        employeeData.user_id,
        employeeData.gender,
        employeeData.dob,
        employeeData.phone,
        employeeData.address,
        employeeData.department_id,
        employeeData.position_id,
        employeeData.hire_date,
        employeeData.base_salary,
    ];
    return await query(sql, values);
};


const getEmployeeById = async (id) => {
    const sql = `
        SELECT 
            employees.id,
            CONCAT(users.first_name, ' ', users.last_name) AS fullname, 
            employees.gender,
            employees.dob,
            employees.phone,
            employees.address,
            departments.name AS department_name,
            positions.name AS position_name,
            employees.hire_date,
            employees.base_salary
        FROM employees
        INNER JOIN users ON users.id = employees.user_id
        INNER JOIN departments ON departments.id = employees.department_id
        INNER JOIN positions ON positions.id = employees.position_id
        WHERE employees.id = ?;
    `;
    const results = await query(sql, [id]);
    return results[0]; // Return the first result
};

const updateEmployee = async (employeeData) => {
    const sql = `
        UPDATE employees 
        SET user_id = ?, gender = ?, dob = ?, phone = ?, address = ?, 
            department_id = ?, position_id = ?, hire_date = ?, base_salary = ? 
        WHERE id = ?;
    `;
    const values = [
        employeeData.user_id,
        employeeData.gender,
        employeeData.dob,
        employeeData.phone,
        employeeData.address,
        employeeData.department_id,
        employeeData.position_id,
        employeeData.hire_date,
        employeeData.base_salary,
        employeeData.id,
    ];
    return await query(sql, values);
};

const deleteEmployee = async (id) => {
    const sql = "DELETE FROM employees WHERE id = ?";
    return await query(sql, [id]);
};

module.exports = {
    getAllEmployees,
    getAllUsers,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};