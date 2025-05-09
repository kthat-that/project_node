const con = require('../../config/db');
const bcrypt = require('bcrypt')
const employeeService = require('../../resources/employee');

const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_TOKEN, { expiresIn: '3d' });
}

// Get all employees
const getEmployeeData = async (req, res) => {
    try {
        const employees = await employeeService.getAllEmployees();
        res.status(200).json({ msg: 'Get data successfully', data: employees });
    } catch (err) {
        console.error('Error retrieving employees:', err);
        res.status(500).json({ error: 'Error retrieving employees.' });
    }
};

// Get create employee form
const getfrmCreate = async (req, res) => {
    try {
        const users = await employeeService.getAllUsers();
        res.status(200).json({ msg: 'Get create form successfully', data: users });
    } catch (err) {
        console.error('Error retrieving users:', err);
        res.status(500).json({ error: 'Error retrieving users.' });
    }
};

// Post create employee
const postfrmCreate = async (req, res) => {
    
    try {
        const employee = await employeeService.createEmployee(req.body);
        res.status(201).json({ msg: 'Create employee successfully', data: employee });
    } catch (err) {
        console.error('Error creating employee:', err);
        res.status(500).json({ error: 'Error creating employee.' });
    }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: `No employee found with ID ${req.params.id}.` });
        }
        res.status(200).json({ msg: 'Get employee by ID successfully', data: employee });
    } catch (err) {
        console.error('Error retrieving employee:', err);
        res.status(500).json({ error: 'Error retrieving employee.' });
    }
};

// Post edit employee
const postEdit = async (req, res) => {
    try {
        const updatedEmployee = await employeeService.updateEmployee(req.body);
        if (!updatedEmployee.affectedRows) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        res.status(200).json({ msg: 'Employee updated successfully', data: updatedEmployee });
    } catch (err) {
        console.error('Error updating employee:', err);
        res.status(500).json({ error: 'Error updating employee.' });
    }
};

// Delete employee
const deleteEmp = async (req, res) => {
    try {
        const result = await employeeService.deleteEmployee(req.params.id);
        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        res.status(200).json({ msg: 'Employee deleted successfully' });
    } catch (err) {
        console.error('Error deleting employee:', err);
        res.status(500).json({ error: 'Error deleting employee.' });
    }
};

module.exports = {
    getEmployeeData,
    getfrmCreate,
    postfrmCreate,
    getEmployeeById,
    postEdit,
    deleteEmp,
};