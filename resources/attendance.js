var moment = require('moment');
const { query } = require('../config/db');
const { formatDate } = require('../utils/format');
const { analyzeAttendance } = require('../utils/attendance');
const { Pagination } = require('../utils/pagination');

exports.AddAttendance = async (req, res) => {
    const { employee_id, status, checkin_time, checkout_time } = req.body;

    if (!employee_id || !status || !checkin_time) {
        return res.status(400).json({ success: false, message: 'Missing or invalid fields: employee_id, status, checkin_time, checkout_time.' });
    }

    const fields = ['employee_id', 'status', 'checkin_time'];
    const values = [employee_id, status, checkin_time];

    if (checkout_time) {
        fields.push('checkout_time');
        values.push(checkout_time);
    }

    const insert = `INSERT INTO attendances (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    const result = await query(insert, values);

    if (result.affectedRows === 0) {
        return res.status(400).json({ success: false, message: 'Failed to insert attendance record.' });
    }

    return res.status(200).json({ success: true, message: 'Attendance Recorded successfully.' });
}
// ----------------------------------
exports.getAllAttendance = async (req, res) => {
    let { date, startDate, endDate, page, per_page, sort = 'desc', name } = req.query;

    if (!page) page = 1;
    if (!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page number or per_page' });
    }

    if (!['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Sort must be either "asc" or "desc"' });
    }

    let values = [];
    let baseSQL = `
        FROM employees emp
        INNER JOIN users user ON emp.user_id = user.id
        INNER JOIN positions pos ON emp.position_id = pos.id
        INNER JOIN attendances att ON emp.id = att.employee_id
        WHERE 1=1`;

    if (date) {
        baseSQL += ` AND DATE(att.created_at) = ?`;
        values.push(formatDate(new Date(date)));
    }

    if (startDate && endDate) {
        baseSQL += ` AND DATE(att.created_at) BETWEEN ? AND ?`;
        values.push(formatDate(new Date(startDate)), formatDate(new Date(endDate)));
    }

    if (name) {
        baseSQL += ` AND CONCAT(user.first_name, ' ', user.last_name) LIKE ?`;
        values.push(`%${name}%`);
    }

    // Get total records
    const countSQL = `SELECT COUNT(*) as total ${baseSQL}`;
    const totalRecordsResult = await query(countSQL, values);
    const totalRecords = totalRecordsResult[0].total;

    const totalPages = Math.ceil(totalRecords / per_page);
    if (page > totalPages && totalPages > 0) {
        page = totalPages; // Prevent going beyond last page
    }

    const attendanceSQL = `
        SELECT 
            emp.id AS emp_id,
            CONCAT(user.first_name, ' ', user.last_name) AS full_name,
            pos.name AS position,
            att.id,
            att.status,
            DATE(att.created_at) AS date,
            att.checkin_time,
            att.checkout_time,
            att.created_at,
            att.updated_at
        ${baseSQL}
        ORDER BY att.created_at ${sort.toUpperCase()}
        LIMIT ? OFFSET ?`;

    values.push(per_page, (page - 1) * per_page);
    const result = await query(attendanceSQL, values);

    if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'No attendance records found' });
    }

    let formattedData = result.map(attendance => ({
        employee: {
            id: attendance.emp_id,
            full_name: attendance.full_name,
            position: attendance.position,
        },
        attendance: {
            id: attendance.id,
            status: attendance.status,
            date: moment(attendance.created_at).format('YYYY-MM-DD'),
            checkin_time: moment(attendance.checkin_time).format('hh:mm A'),
            checkout_time: moment(attendance.checkout_time).format('hh:mm A'),
        },
    }));

    return res.status(200).json({
        success: true,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords,
        },
        data: formattedData
    });
};


exports.getAttendanceByID = async (req, res) => {
    const emp_id = req.params.id;
    const { date, startDate, endDate } = req.query;
    let values = [emp_id];
    let absentCount = [];
    let report = [];
    let format = [];
    let analyzed_report;

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let attendanceSQL = `SELECT 
                emp.id as emp_id,
                CONCAT(user.first_name, ' ', user.last_name) AS full_name,
                pos.name as position,
                att.id,
                att.status,
                DATE(att.created_at) as date,
                att.checkin_time,
                att.checkout_time,
                att.created_at,
                att.updated_at
            FROM employees emp
            INNER JOIN users user ON emp.user_id = user.id
            INNER JOIN positions pos ON emp.position_id = pos.id
            INNER JOIN attendances att ON emp.id = att.employee_id
            WHERE emp.id = ?`;

    let countAbsent = `SELECT COUNT(*) AS absent
            FROM employees e
            LEFT JOIN attendances a 
            ON e.id = a.employee_id 
            AND DATE(a.created_at) = ?
            WHERE a.employee_id IS NULL`;

    let countPermission = `SELECT * from leaves lve INNER JOIN employees emp ON emp.id = lve.employee_id WHERE lve.status = 2`;

    if (date) {
        const parsedDate = new Date(date);
        attendanceSQL += ` AND DATE(att.created_at) = ? `;
        countPermission += ` AND DATE(lve.created_at) = ? `
        values.push(formatDate(parsedDate));
        absentCount.push(formatDate(parsedDate));
    }

    if (startDate && endDate) {
        attendanceSQL += ` AND DATE(att.created_at) BETWEEN ? AND ? `;
        countPermission += ` AND DATE(lve.start_date) BETWEEN? AND? AND DATE(lve.end_date) BETWEEN? AND? `
        values.push(firstDayOfMonth, lastDayOfMonth);
    }

    if (absentCount.length === 0) {
        absentCount.push(currentDate);
    }

    const result = await query(attendanceSQL, values);
    const absent = await query(countAbsent, absentCount);
    const permission = await query(countPermission, values);

    // console.log(absent, values);

    if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'No attendance records found' });
    }

    result.map(attendance => {
        format.push({
            employee: {
                id: attendance.emp_id,
                full_name: attendance.full_name,
                position: attendance.position,
            },
            attendance: {
                id: attendance.id,
                status: attendance.status,
                date: moment(attendance.created_at).format('YYYY-MM-DD'),
                checkin_time: moment(attendance.checkin_time).format('YYYY-MM-DD hh:mm A'),
                checkout_time: moment(attendance.checkout_time).format('YYYY-MM-DD hh:mm A'),
                created_at: moment(attendance.created_at).format('YYYY-MM-DD hh:mm A'),
                updated_at: moment(attendance.updated_at).format('YYYY-MM-DD hh:mm A')
            },
        });

        report.push({
            emp_id: attendance.emp_id,
            status: attendance.status,
            date: formatDate(attendance.created_at)
        });
    });
    // console.log(report);


    if (startDate && endDate) {
        analyzed_report = analyzeAttendance(report, startDate, endDate);
    }
    else {
        analyzed_report = analyzeAttendance(report);
    }

    return res.status(200).json({
        success: true,
        data: format,
        report: analyzed_report
    });
}

exports.updateAttendance = async (req, res) => {
    const { id, status, checkin_time, checkout_time } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Missing or invalid fields: id.' });
    }

    const fields = [];
    const values = [];

    if (status) {
        fields.push('status=?');
        values.push(status);
    }
    if (checkin_time) {
        fields.push('checkin_time=?');
        values.push(checkin_time);
    }
    if (checkout_time) {
        fields.push('checkout_time=?');
        values.push(checkout_time);
    }

    values.push(id);

    const update = `UPDATE attendances SET ${fields.join(', ')} WHERE id =?`;
    const result = await query(update, values);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.status(200).json({ success: true, message: 'Attendance updated successfully.' });
}

exports.deleteAttendance = async (req, res) => {
    const { id } = req.params;
    if (!id) { return res.status(400).json({ success: false, message: 'Missing or invalid fields: id.' }) }

    const deleteSQL = "DELETE FROM `attendances` WHERE id = ?";
    const result = await query(deleteSQL, id);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.status(200).json({ success: true, message: 'Attendance deleted successfully.' });
}

exports.getOwnAttendance = async (req, res) => {
    try {
        const emp_id = req.user.id;
        let { date, startDate, endDate, page = 1, per_page = 10 } = req.query;

        page = parseInt(page);
        per_page = parseInt(per_page);
        const offset = (page - 1) * per_page;

        let values = [emp_id];
        let filters = "WHERE emp.id = ?";

        if (date) {
            filters += " AND DATE(att.created_at) = ?";
            values.push(date);
        } else if (startDate && endDate) {
            filters += " AND DATE(att.created_at) BETWEEN ? AND ?";
            values.push(startDate, endDate);
        }

        let attendanceSQL = `
            SELECT 
                emp.id AS emp_id,
                CONCAT(user.first_name, ' ', user.last_name) AS full_name,
                pos.name AS position,
                att.id,
                att.status,
                DATE_FORMAT(att.created_at, '%Y-%m-%d') AS date,
                DATE_FORMAT(att.checkin_time, '%Y-%m-%d %h:%i %p') AS checkin_time,
                DATE_FORMAT(att.checkout_time, '%Y-%m-%d %h:%i %p') AS checkout_time
            FROM employees emp
            INNER JOIN users user ON emp.user_id = user.id
            INNER JOIN positions pos ON emp.position_id = pos.id
            INNER JOIN attendances att ON emp.id = att.employee_id
            ${filters}
            ORDER BY att.created_at DESC
            LIMIT ? OFFSET ?`;

        values.push(per_page, offset);
        const result = await query(attendanceSQL, values);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, message: 'No attendance records found' });
        }

        const formattedData = result.map(attendance => ({
            employee: {
                id: attendance.emp_id,
                full_name: attendance.full_name,
                position: attendance.position,
            },
            attendance: {
                id: attendance.id,
                status: attendance.status,
                date: attendance.date,
                checkin_time: attendance.checkin_time || "N/A",
                checkout_time: attendance.checkout_time || "N/A",
            },
        }));

        // **Fixed COUNT Query**
        let countQuery = `SELECT COUNT(*) AS total FROM attendances WHERE employee_id = ?`;
        let countValues = [emp_id];

        if (date) {
            countQuery += " AND DATE(created_at) = ?";
            countValues.push(date);
        } else if (startDate && endDate) {
            countQuery += " AND DATE(created_at) BETWEEN ? AND ?";
            countValues.push(startDate, endDate);
        }

        const countResult = await query(countQuery, countValues);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / per_page);

        return res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
