const { query } = require('../config/db');
const vPosition = require('../validation/position');

exports.getAllPosition = async (req, res) => {
    const data = await query('SELECT * FROM positions');
    res.json({ result: true, msg: 'Position retrieved successfully', data: data });
};

exports.postCreatePosition = async (req, res) => {
    try {
        const {department_id, name, description} = req.body;
        const data = await query('SELECT * FROM `positions` WHERE `name` = ?', [name]);

        if (data.length > 0) {
            return res.json({ result: false, msg: 'This position is already created!', data: [] });
        }
        if(!department_id || !name || !description) {
            return res.json({ result: false, msg: 'All fields are required!' });
        }

        const sqlPosition = "INSERT INTO `positions`(`name`, `department_id`, `description`) VALUES (?, ?, ?)";
        let arrData = [name, department_id, description];

        await query(sqlPosition, arrData)
        res.json({ result: true, msg: 'Position created successfully!' });

    } catch (err) {
        res.json({
            msg: err.message
        })
    }

};


exports.deletePosition = async (req, res) => {

    try {
        const id = req.params.id;
        const data = await query("DELETE FROM `positions` WHERE id = ?", [id]);
        if (data.affectedRows === 0) {
            res.status(404).json({
                message: 'This ID does not exist'
            });
            return;
        }

        res.status(200).json({
            message: 'Delete successfully'
        })
    } catch (err) {
        res.json({
            msg: err.message
        })
    }


};

// exports.getEditPosition = async (req, res) => {
//     console.log('param', req.params);
//     const id = req.params.id;
//     const sqlPosition = 'select * from positions where id = ?';

//     const data = await query(sqlPosition,[id]);

//     res.status(200).json({
//         message: 'update successfully'
//     })

//     con.query('select * from positions where id = ?', req.params.id, (err, data) => {
//         if (err) {
//             console.log(err);
//         }

//         console.log(data);
//         res.render('edit', { result: data });
//     });
// }

exports.postEditPosition = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description } = req.body;
        console.log(name, description);
        

        // Check if the position exists
        const checkSql = "SELECT * FROM `positions` WHERE id = ?";
        const results = await query(checkSql, [id]);

        if (results.length === 0) {
            return res.status(404).json({
                result: false,
                msg: 'This ID is not valid.'
            });
        }

        const nameCheckSql = "SELECT * FROM `positions` WHERE name = ? AND id != ?";
        const nameCheckResults = await query(nameCheckSql, [name, id]);

        if (nameCheckResults.length > 0) {
            return res.status(400).json({
                result: false,
                msg: 'This position name already exists.'
            });
        }

        // Proceed with the update
        const sql = "UPDATE `positions` SET name = ?, description = ? WHERE id = ?";
        await query(sql, [name, description, id]);

        return res.status(200).json({
            result: true,
            msg: 'Update Position successfully!'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            result: false,
            msg: 'Internal Server Error',
            error: err.message
        });
    }
};
