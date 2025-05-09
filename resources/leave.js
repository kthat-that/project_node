const moment = require('moment');
const { query } = require('../config/db');
const { formatDate, formatDateTime } = require('../utils/format')
const { Pagination } = require('../utils/pagination');

exports.requestLeave = async (req, res) => {
    let id = req.params.id;
    const { leave_reason, leave_type, start_date, end_date } = req.body;

    if (!start_date || !end_date || !leave_reason || !leave_type) return res.status(400).json({ success: false, message: 'Please provide all required fields' });

    let sql = "SELECT employees.id as id FROM employees inner join users on employees.user_id = users.id where users.id =?";
    const employee_id = await query(sql, id);

    let sql1 = "SELECT status FROM leaves WHERE employee_id =? AND (start_date BETWEEN? AND? OR end_date BETWEEN? AND?)";
    const leaveStatus = await query(sql1, [employee_id[0].id, start_date, end_date, start_date, end_date]);

    const today = new Date();

    if (new Date(end_date) < new Date(start_date) || today > new Date(end_date) || today > new Date(start_date)) {
        return res.status(400).json({ success: false, message: `end date must be after start date and not before ${formatDate(today)}` });
    }

    if (leaveStatus.length === 0) {
        let sql = "INSERT INTO `leaves`(`employee_id`, `leave_reason`, `leave_type`, `start_date`, `end_date`) VALUES (?,?,?,?,?)";
        await query(sql, [id, leave_reason, leave_type, start_date, end_date]);
        return res.status(200).json({ success: true, message: 'Leave request submitted successfully' });
    }
    else {
        return res.status(400).json({ success: false, message: 'You have already requested a leave for this period' });
    }
}

exports.getLeaves = async (req, res) => {
    let { name, date, status, page, per_page, sort = 'desc' } = req.query;

    if (!page) page = 1;
    if (!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid page number or per_page'
        });
    }

    if (sort && !['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'Sort must be either "asc" or "desc"'
        });
    }

    let sql = `SELECT 
        emp.id AS emp_id,
        CONCAT(user.first_name, " ", user.last_name) AS name, 
        pos.name AS position,
        user.avatar AS avatar,
        lve.id AS leave_id,
        lve.leave_reason AS leave_reason,
        lve.leave_type AS leave_type,
        lve.start_date AS start_date,
        lve.end_date AS end_date,
        DATEDIFF(lve.end_date, lve.start_date) + 1 AS duration,
        lve.status AS status,
        lve.created_at AS created_at,
        lve.updated_at AS updated_at
    FROM positions AS pos  
    INNER JOIN employees AS emp ON emp.position_id = pos.id  
    INNER JOIN users AS user ON emp.user_id = user.id
    INNER JOIN leaves AS lve ON lve.employee_id = emp.id
    WHERE 1=1 `;

    const countRecords = `SELECT COUNT(*) AS total FROM positions AS pos  
    INNER JOIN employees AS emp ON emp.position_id = pos.id  
    INNER JOIN users AS user ON emp.user_id = user.id
    INNER JOIN leaves AS lve ON lve.employee_id = emp.id
    WHERE 1=1 `;

    let values = [];

    if (name && name.trim() !== '') {
        sql += ` AND CONCAT(user.first_name, " ", user.last_name) LIKE ?`;
        values.push(`%${name}%`);
    }
    if (date && date.trim() !== '') {
        sql += ` AND ? BETWEEN lve.start_date AND lve.end_date`;
        values.push(date);
    }
    if (status && status.trim() !== '') {
        sql += ` AND lve.status = ?`;
        values.push(status);
    }

    const pagination = await Pagination(countRecords, values, page, per_page);

    sql += ` ORDER BY lve.start_date ${sort.toUpperCase()}`;
    sql += ` LIMIT ? OFFSET ?`;
    values.push(per_page, (page - 1) * per_page);

    const leaves = await query(sql, values);

    if (leaves.length === 0) return res.status(404).json({ success: false, message: 'No leave records found' });

    const formatted = leaves.map(leave => ({
        employee: {
            id: leave.emp_id,
            full_name: leave.name,
            position: leave.position,
            avatar: leave.avatar
        },
        leave: {
            id: leave.leave_id,
            leave_reason: leave.leave_reason,
            leave_type: leave.leave_type,
            start_date: formatDate(leave.start_date),
            end_date: formatDate(leave.end_date),
            duration: leave.duration,
            status: leave.status,
            created_at: moment(leave.created_at).format('YYYY-MM-DD hh:mm A'),
            updated_at: moment(leave.updated_at).format('YYYY-MM-DD hh:mm A'),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination: pagination,
        data: formatted
    });
};

exports.getLeaveById = async (req, res) => {
    let id = req.params.id;
    let { page, per_page, sort = 'desc' } = req.query;
    let values = [];

    if (!page) page = 1;
    if (!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid page number or per_page'
        });
    }

    if (sort && !['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'Sort must be either "asc" or "desc"'
        });
    }

    let sql = `SELECT 
        emp.id as emp_id,
        CONCAT(user.first_name, " ", user.last_name) AS name, 
        pos.name as position,
        user.avatar as avatar,
        lve.id AS leave_id,
        lve.leave_reason AS leave_reason,
        lve.leave_type as leave_type,
        lve.start_date as start_date,
        lve.end_date as end_date,
        DATEDIFF(end_date, start_date) + 1 AS duration,
        lve.status as status,
        lve.created_at as created_at,
        lve.updated_at as updated_at
    FROM positions as pos  
    INNER JOIN employees as emp ON pos.id = emp.id
    INNER JOIN users as user ON emp.user_id = user.id
    INNER JOIN leaves as lve ON lve.employee_id = emp.id WHERE emp.id = ?`;

    const countRecords = `SELECT COUNT(*) AS total FROM positions AS pos  
    INNER JOIN employees AS emp ON emp.position_id = pos.id  
    INNER JOIN users AS user ON emp.user_id = user.id
    INNER JOIN leaves AS lve ON lve.employee_id = emp.id
    WHERE emp.id = ?`

    const pagination = await Pagination(countRecords, id, page, per_page);

    sql += ` ORDER BY lve.start_date ${sort.toUpperCase()}`;
    sql += ` LIMIT ? OFFSET ?`;
    values.push(id);
    values.push(per_page, (page - 1) * per_page);

    const leaves = await query(sql, values);

    if (leaves.length === 0) return res.status(404).json({ success: false, message: 'No leave records found' });

    const formatted = leaves.map(leave => (
        {
            employee: {
                id: leave.emp_id,
                full_name: leave.name,
                position: leave.position,
                avatar: leave.avatar
            },
            leave: {
                id: leave.leave_id,
                leave_reason: leave.leave_reason,
                leave_type: leave.leave_type,
                start_date: formatDate(leave.start_date),
                end_date: formatDate(leave.end_date),
                duration: leave.duration,
                status: leave.status,
                created_at: moment(leave.created_at).format('YYYY-MM-DD hh:mm A'),
                updated_at: moment(leave.updated_at).format('YYYY-MM-DD hh:mm A'),
            }
        }));

    return res.status(200).json({
        success: true,
        pagination: pagination,
        data: formatted
    });
}

exports.editLeave = async (req, res) => {
    let leave_id = req.params.id;
    let { leave_reason, leave_type, start_date, end_date, status } = req.body;
    let fields = [];
    let values = [];

    if (!leave_id) return res.status(400).json({ success: false, message: 'Please provide leave id' });

    const today = new Date();

    if (start_date && end_date) {
        if (new Date(end_date) < new Date(start_date) || today > new Date(end_date) || today > new Date(start_date)) {
            return res.status(400).json({ success: false, message: `End date must be after start date and not before ${formatDate(today)}` });
        }
    }

    if (leave_reason) {
        fields.push('leave_reason =?');
        values.push(leave_reason);
    }
    if (leave_type) {
        fields.push('leave_type=?');
        values.push(leave_type);
    }
    if (start_date) {
        fields.push('start_date=?');
        values.push(start_date);
    }
    if (end_date) {
        fields.push('end_date=?');
        values.push(end_date);
    }
    if (status) {
        fields.push('status=?');
        values.push(status);
    }
    values.push(leave_id);

    let sql = `UPDATE leaves SET ${fields.join(', ')} WHERE id =?`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    return res.status(200).json({ success: true, message: 'Leave request updated successfully' });
}

exports.deleteLeave = async (request, res) => {
    let leave_id = request.params.id;

    let sql = "DELETE FROM leaves WHERE id =?";
    const result = await query(sql, leave_id);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    return res.status(200).json({ success: true, message: 'Leave request deleted successfully' });
}
exports.getOwnLeave = async (req, res) => {
    let id = req.user.id;
    let { page, per_page, sort = 'desc' } = req.query;
    let values = [];

    if (!page) page = 1;
    if (!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid page number or per_page'
        });
    }

    if (sort && !['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'Sort must be either "asc" or "desc"'
        });
    }

    let sql = `SELECT 
        emp.id as emp_id,
        CONCAT(user.first_name, " ", user.last_name) AS name, 
        pos.name as position,
        user.avatar as avatar,
        lve.id AS leave_id,
        lve.leave_reason AS leave_reason,
        lve.leave_type as leave_type,
        lve.start_date as start_date,
        lve.end_date as end_date,
        DATEDIFF(end_date, start_date) + 1 AS duration,
        lve.status as status,
        lve.created_at as created_at,
        lve.updated_at as updated_at
    FROM positions as pos  
    INNER JOIN employees as emp ON pos.id = emp.id
    INNER JOIN users as user ON emp.user_id = user.id
    INNER JOIN leaves as lve ON lve.employee_id = emp.id WHERE user.id = ?`;

    const countRecords = `SELECT COUNT(*) AS total FROM positions AS pos  
    INNER JOIN employees AS emp ON emp.position_id = pos.id  
    INNER JOIN users AS user ON emp.user_id = user.id
    INNER JOIN leaves AS lve ON lve.employee_id = emp.id
    WHERE user.id = ?`

    const pagination = await Pagination(countRecords, id, page, per_page);

    sql += ` ORDER BY lve.start_date ${sort.toUpperCase()}`;
    sql += ` LIMIT ? OFFSET ?`;
    values.push(id);
    values.push(per_page, (page - 1) * per_page);

    const leaves = await query(sql, values);

    if (leaves.length === 0) return res.status(404).json({ success: false, message: 'No leave records found' });

    const formatted = leaves.map(leave => (
        {
            employee: {
                id: leave.emp_id,
                full_name: leave.name,
                position: leave.position,
                avatar: leave.avatar
            },
            leave: {
                id: leave.leave_id,
                leave_reason: leave.leave_reason,
                leave_type: leave.leave_type,
                start_date: formatDate(leave.start_date),
                end_date: formatDate(leave.end_date),
                duration: leave.duration,
                status: leave.status,
                created_at: moment(leave.created_at).format('YYYY-MM-DD hh:mm A'),
                updated_at: moment(leave.updated_at).format('YYYY-MM-DD hh:mm A'),
            }
        }));

    return res.status(200).json({
        success: true,
        pagination: pagination,
        data: formatted
    });
}