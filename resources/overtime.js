const { query } = require('../config/db');
const { formatDate, formatDateTime } = require('../utils/format');
const { Pagination } = require('../utils/pagination');
const { calculateHourlyRate, calculateOvertimeRate } = require('../utils/payroll');
const { calculateHours } = require('../utils/scan');

exports.RequestOT = async (req, res) => {
    let id = req.user.id;
    const { date, reason } = req.body;
    const today = new Date();
    
    if (!date || !reason) return res.status(400).json({ success: false, message: 'Please provide a date and reason' });
    if (new Date(date) < today) return res.status(400).json({ success: false, message: 'Date must be a future date' });

    let sql = "select employees.id as id from employees inner join users on employees.user_id = users.id where users.id = ?";
    const employee_id = await query(sql, id);

    let sql1 = "SELECT approval_status FROM over_time WHERE employee_id = ? AND date = ?";
    const checkToday = await query(sql1, [employee_id[0].id, date]);

    if (checkToday.length === 0) {
        let sql2 = "INSERT INTO over_time (employee_id,date,reason , approval_status) VALUES (?,?,?,?)";
        await query(sql2, [employee_id[0].id, date, reason, 1]);
        return res.status(200).json({ success: true, message: 'Request sent successfully' });
    }
    else {
        if (checkToday[0].approval_status === 1 || checkToday[0].approval_status === 2) {
            return res.status(400).json({ success: false, message: `You have already requested for ${date}.` });
        }
        else {
            return res.status(400).json({ success: false, message: 'Your request for today has been rejected.' });
        }
    }
}

exports.getAllOT = async (req, res) => {
    console.log(req.user.id);

    let { name, date, status, page = 1, per_page = 10, sort = 'desc' } = req.query;
    let values = [];

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
            ot.id AS ot_id,
            CONCAT(user.first_name, " ", user.last_name) AS name, 
            pos.name as position,
            user.avatar as avatar,
            ot.reason as reason,
            ot.date AS date,
            ot.checkin_time as checkin_time,
            ot.checkout_time as checkout_time,
            ot.hour as hour,
            ot.ot_pay as ot_pay,
            ot.approval_status as status,
            ot.created_at as created_at,
            ot.updated_at as updated_at
        FROM positions as pos  
        INNER JOIN employees as emp ON pos.id = emp.position_id
        INNER JOIN users as user ON emp.user_id = user.id
        INNER JOIN over_time as ot ON ot.employee_id = emp.id
        WHERE 1=1`;

    let countSql = `
            SELECT COUNT(*) AS total 
            FROM positions as pos  
            INNER JOIN employees as emp ON pos.id = emp.position_id
            INNER JOIN users as user ON emp.user_id = user.id
            INNER JOIN over_time as ot ON ot.employee_id = emp.id
            WHERE 1=1`;

    if (name) {
        sql += ` AND CONCAT(user.first_name, " ", user.last_name) LIKE ?`;
        countSql += ` AND CONCAT(user.first_name, " ", user.last_name) LIKE ?`;
        values.push(`%${name}%`);
    }
    if (date) {
        sql += ` AND DATE(ot.date) = DATE(?)`;
        countSql += ` AND DATE(ot.date) = DATE(?)`;
        values.push(date);
    }
    if (status) {
        sql += ` AND ot.approval_status = ?`;
        countSql += ` AND ot.approval_status = ?`;
        values.push(status);
    }

    sql += ` ORDER BY ot.date ${sort.toUpperCase()}`;
    
    const pagination = await Pagination(countSql, values, page, per_page);

    if (pagination.total_records === 0) {
        return res.status(404).json({
            success: false,
            message: 'No overtime requests found'
        });
    }

    sql += ` LIMIT ? OFFSET ?`;
    values.push(per_page, (page - 1) * per_page);

    const requests = await query(sql, values);

    const formatted = requests.map(request => ({
        employee: {
            id: request.emp_id,
            full_name: request.name,
            position: request.position,
            avatar: request.avatar
        },
        overtime: {
            id: request.ot_id,
            date: formatDate(request.date),
            reason: request.reason,
            checkin_time: formatDateTime(request.checkin_time),
            checkout_time: formatDateTime(request.checkout_time),
            hour: request.hour,
            ot_pay: request.ot_pay,
            approval_status: request.status,
            created_at: formatDateTime(request.created_at),
            updated_at: formatDateTime(request.updated_at),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination,
        data: formatted,
    });
};

exports.getOTByEmployeeID = async (req, res) => {
    const id = req.params.id;
    let { date, status, page = 1, per_page = 10, sort = 'desc' } = req.query;
    let values = [id];

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Employee ID is required'
        });
    }

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
            ot.id AS ot_id,
            CONCAT(user.first_name, " ", user.last_name) AS name, 
            pos.name as position,
            ot.reason as reason,
            ot.date AS date,
            ot.checkin_time as checkin_time,
            ot.checkout_time as checkout_time,
            ot.hour as hour,
            ot.ot_pay as ot_pay,
            ot.approval_status as status,
            ot.created_at as created_at,
            ot.updated_at as updated_at
        FROM positions as pos  
        INNER JOIN employees as emp ON pos.id = emp.position_id
        INNER JOIN users as user ON emp.user_id = user.id
        INNER JOIN over_time as ot ON ot.employee_id = emp.id
        WHERE emp.id = ?`;

    let countSql = `
            SELECT COUNT(*) AS total 
            FROM positions as pos  
            INNER JOIN employees as emp ON pos.id = emp.position_id
            INNER JOIN users as user ON emp.user_id = user.id
            INNER JOIN over_time as ot ON ot.employee_id = emp.id
            WHERE emp.id = ?`;

    if (date) {
        sql += ` AND DATE(ot.date) = DATE(?)`;
        countSql += ` AND DATE(ot.date) = DATE(?)`;
        values.push(date);
    }

    if (status) {
        sql += ` AND ot.approval_status = ?`;
        countSql += ` AND ot.approval_status = ?`;
        values.push(status);
    }

    sql += ` ORDER BY ot.date ${sort.toUpperCase()}`;

    const pagination = await Pagination(countSql, values, page, per_page);

    if (pagination.total_records === 0) {
        return res.status(404).json({
            success: false,
            message: 'No overtime requests found'
        });
    }

    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    values.push(per_page, (page - 1) * per_page);

    const requests = await query(paginatedSql, values);

    const formatted = requests.map(request => ({
        employee: {
            id: request.emp_id,
            full_name: request.name,
            position: request.position,
        },
        overtime: {
            id: request.ot_id,
            date: formatDate(request.date),
            reason: request.reason,
            checkin_time: formatDateTime(request.checkin_time),
            checkout_time: formatDateTime(request.checkout_time),
            hour: request.hour,
            ot_pay: request.ot_pay,
            approval_status: request.status,
            created_at: formatDateTime(request.created_at),
            updated_at: formatDateTime(request.updated_at),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination,
        data: formatted
    });
};

exports.editOTRequest = async (req, res) => {
    const id = req.params.id;
    const { date, reason, approval_status, checkin_time, checkout_time } = req.body;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Overtime request ID is required'
        });
    }

    const existing = await query('SELECT * FROM over_time WHERE id = ?', id);

    if (existing.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Overtime request not found'
        });
    }

    const employee = await query('SELECT emp.base_salary FROM employees emp JOIN over_time ot ON emp.id = ot.employee_id WHERE ot.id = ?', id);

    if (employee.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Employee not found'
        });
    }

    let fields = [];
    let values = [];

    if (date) {
        fields.push('date = ?');
        values.push(date);
    }

    if (reason) {
        fields.push('reason = ?');
        values.push(reason);
    }

    if (approval_status) {
        if (!['1', '2', '3'].includes(approval_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid approval status'
            });
        }
        fields.push('approval_status = ?');
        values.push(approval_status);
    }

    const check_time = await query('select checkin_time, checkout_time from over_time where id = ?', id);
    const finalCheckinTime = check_time[0].checkin_time;
    const finalCheckoutTime = check_time[0].checkout_time;

    let hours, overtimeRate, otPay;
    const hourlyRate = calculateHourlyRate(employee[0].base_salary);

    if (checkin_time && checkout_time) {

        if (new Date(checkout_time) <= new Date(check_time)) {
            return res.status(400).json({
                success: false,
                message: 'Checkout time must be after checkin time'
            });
        }
    }

    if (checkin_time) {
        fields.push('checkin_time = ?');
        values.push(checkin_time);

        if (checkout_time) {
            hours = calculateHours(checkin_time, checkout_time);
            overtimeRate = calculateOvertimeRate(checkin_time);
            otPay = Number((hours * overtimeRate * hourlyRate).toFixed(2));
            fields.push('hour = ?', 'ot_pay = ?');
            values.push(hours, otPay);
        }
        if (finalCheckoutTime) {
            hours = calculateHours(checkin_time, finalCheckoutTime);
            overtimeRate = calculateOvertimeRate(checkin_time);
            otPay = Number((hours * overtimeRate * hourlyRate).toFixed(2));
            fields.push('hour = ?', 'ot_pay = ?');
            values.push(hours, otPay);
        }
    }

    if (checkout_time && !checkin_time) {
        hours = calculateHours(finalCheckinTime, checkout_time);
        overtimeRate = calculateOvertimeRate(finalCheckinTime);
        otPay = Number((hours * overtimeRate * hourlyRate).toFixed(2));
        fields.push('checkout_time = ?');
        fields.push('hour = ?', 'ot_pay = ?');
        values.push(checkout_time, hours, otPay);
    }

    if (fields.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one field must be updated'
        });
    }

    values.push(id);
    const sql = `UPDATE over_time SET ${fields.join(', ')} WHERE id = ?`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Failed to update overtime request'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Request updated successfully'
    });
};

exports.deleteOTRecord = async (req, res) => {
    const id = req.params.id;
    let sql = "DELETE FROM `over_time` WHERE id = ?"
    const result = await query(sql, id);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Overtime record not found' });
    }
    return res.status(200).json({ success: true, message: 'Overtime Record deleted successfully' });
}

exports.getOTbyUser = async (req, res) => {
    const id = req.user.id;
    let { date, status, page = 1, per_page = 10, sort = 'desc' } = req.query;
    let values = [id];

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
            ot.id AS ot_id,
            CONCAT(user.first_name, " ", user.last_name) AS name, 
            pos.name as position,
            ot.reason as reason,
            ot.date AS date,
            ot.checkin_time as checkin_time,
            ot.checkout_time as checkout_time,
            ot.hour as hour,
            ot.ot_pay as ot_pay,
            ot.approval_status as status,
            ot.created_at as created_at,
            ot.updated_at as updated_at
        FROM positions as pos  
        INNER JOIN employees as emp ON pos.id = emp.position_id
        INNER JOIN users as user ON emp.user_id = user.id
        INNER JOIN over_time as ot ON ot.employee_id = emp.id
        WHERE user.id = ?`;

    let countSql = `
            SELECT COUNT(*) AS total 
            FROM positions as pos  
            INNER JOIN employees as emp ON pos.id = emp.position_id
            INNER JOIN users as user ON emp.user_id = user.id
            INNER JOIN over_time as ot ON ot.employee_id = emp.id
            WHERE emp.id = ?`;

    if (date) {
        sql += ` AND DATE(ot.date) = DATE(?)`;
        countSql += ` AND DATE(ot.date) = DATE(?)`;
        values.push(date);
    }

    if (status) {
        sql += ` AND ot.approval_status = ?`;
        countSql += ` AND ot.approval_status = ?`;
        values.push(status);
    }

    sql += ` ORDER BY ot.date ${sort.toUpperCase()}`;

    const pagination = await Pagination(countSql, values, page, per_page);

    if (pagination.total_records === 0) {
        return res.status(404).json({
            success: false,
            message: 'No overtime requests found'
        });
    }

    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    values.push(per_page, (page - 1) * per_page);

    const requests = await query(paginatedSql, values);

    const formatted = requests.map(request => ({
        employee: {
            id: request.emp_id,
            full_name: request.name,
            position: request.position,
        },
        overtime: {
            id: request.ot_id,
            date: formatDate(request.date),
            reason: request.reason,
            checkin_time: formatDateTime(request.checkin_time),
            checkout_time: formatDateTime(request.checkout_time),
            hour: request.hour,
            ot_pay: request.ot_pay,
            approval_status: request.status,
            created_at: formatDateTime(request.created_at),
            updated_at: formatDateTime(request.updated_at),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination,
        data: formatted
    });
}