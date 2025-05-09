const { query } = require('../config/db');
const jwt = require('jsonwebtoken');
// const vDepartment = require('../validation/department');

exports.getAll = async (page = 1, perpage = 10) => {
    try {
        page = parseInt(page);
        perpage = parseInt(perpage);

        let values = [perpage, (page - 1) * perpage];

        // SELECT a.*, e.name 
        // FROM announcements AS a
        // LEFT JOIN employees AS e ON a.employee_id = e.id
        // LIMIT ? OFFSET ?`;
        // Query to fetch paginated results
        let queryStr = `SELECT 
                    announcements.id,
                    users.avatar,
                    CONCAT(users.first_name, ' ', users.last_name) AS full_name,
                    announcements.annount_date,
                    announcements.description,
                    announcements.status
                 FROM announcements 
                inner join users on users.id = announcements.employee_id    
                 ORDER BY announcements.id DESC
                LIMIT ? OFFSET ?`;
        const result = await query(queryStr, values);

        // Query to count total announcements
        let countQuery = `SELECT COUNT(*) AS total FROM announcements`;
        const [countResult] = await query(countQuery);
        
        const totalCount = countResult?.total ?? 0;
        const totalPage = totalCount > 0 ? Math.ceil(totalCount / perpage) : 1;

        return {
            result: true,
            message: 'Announcements retrieved successfully',
            paginate: {
                total: totalCount,
                page,
                perpage,
                pages: totalPage
            },
            rows: result
        };
    } catch (err) {
        console.error(err);
        return {
            result: false,
            message: 'Database error'
        };
    }
};

exports.deleteAnnount = async (req, res) => {
    try {
        const id = req.params.id;


        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid or missing ID" });
        }

        // Check if the record exists
        const existing = await query('SELECT * FROM `announcements` WHERE id=?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ result: false, message: "Record not found" });
        }

        const result = await query('DELETE FROM `announcements` WHERE id=?', [id]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ result: false, message: "Failed to delete record" });
        }

        return res.status(200).json({ result: true, message: "Successfully deleted announcements" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, message: "Database error" });
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            const id = decodedToken.id;
            const { date, description } = req.body;

            if (!date || !description) {
                return res.status(403).json({ message: "All fields are required" });
            }

            let sql = "INSERT INTO `announcements`(`employee_id`, `annount_date`,`status`, `description`) VALUES (?,?,?,?)";
            let myArr = [id, date,1, description];
            await query(sql, myArr);
            return res.status(200).json({ result: true, message: "Announcement created successfully" });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            const userId = decodedToken.id;
            const { date, description ,status} = req.body;
            const id = req.params.id;
            
            if (!id || !date || !description || !status) {
                return res.status(400).json({ message: "All fields are required" });
            }
            const existing = await query('SELECT * FROM `announcements` WHERE id=?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ result: false, message: "Announcement not found" });
            }

            let sql = "UPDATE `announcements` SET `employee_id`=?, `annount_date`=?, `description`=? , `status`=? WHERE `id`=?";
            let myArr = [userId, date, description, status,id];
            const result = await query(sql, myArr);

            if (result.affectedRows === 0) {
                return res.status(500).json({ result: false, message: "Failed to update announcement" });
            }

            return res.status(200).json({ result: true, message: "Announcement updated successfully" });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ result: false, msg: 'Database error' });
    }
};