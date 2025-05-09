const { query } = require('../config/db');
const vDepartment = require('../validation/department');

exports.getAllDepartment = async (req, res) => {
    try {
        const result = await query('SELECT * FROM departments');
        return res.status(200).json({ result: true, msg: 'Departments retrieved successfully', data: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};


exports.postCreateDepartment = async (req, res) => {
    try {
     
        const { name} = req.body;

        // Validate input
        const { error } = vDepartment(req.body);
        if (error) {
            return res.status(400).json({ result: false, msg: error.message });
        }

        // Check if department name already exists
        const existingDept = await query('SELECT * FROM `departments` WHERE `name` = ?', [name]);
        if (existingDept.length > 0) {
            return res.status(400).json({ result: false, msg: 'This department already exists!' });
        }

        // Insert new department
        await query("INSERT INTO `departments`(`name`) VALUES ( ?)", [name]);

        return res.status(201).json({ result: true, msg: 'Department created successfully!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await query("DELETE FROM `departments` WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: 'This ID does not exist' });
        }

        return res.status(200).json({ result: true, msg: 'Department deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};

// exports.getEditDepartment = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const data = await query('SELECT * FROM departments WHERE id = ?', [id]);

//         if (data.length === 0) {
//             return res.status(404).json({ result: false, msg: 'Department not found' });
//         }

//         return res.status(200).json({ result: true, data });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ result: false, msg: 'Database error' });
//     }
// };

exports.postEditDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body;

        // Check if department exists
        const department = await query("SELECT * FROM `departments` WHERE id = ?", [id]);
        if (department.length === 0) {
            return res.status(404).json({ result: false, msg: 'This ID is not valid. Try another ID to update!' });
        }

        // Check if the new name already exists for another department
        const nameCheck = await query("SELECT * FROM `departments` WHERE name = ? AND id != ?", [name, id]);
        if (nameCheck.length > 0) {
            return res.status(400).json({ result: false, msg: 'This department name already exists.' });
        }

        // Update department details
        await query("UPDATE `departments` SET name = ? WHERE id = ?", [name, id]);

        return res.status(200).json({ result: true, msg: 'Department updated successfully!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};


