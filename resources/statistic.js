const { query } = require('../config/db');
const { getFirstDayOfMonth, getLastDayOfMonth } = require('../utils/payroll');
const { formatDate } = require('../utils/format');
const moment = require('moment');
const Holidays = require('date-holidays');
const hd = new Holidays('KH');
const jwt = require('jsonwebtoken');

exports.getDashboardStats = async (req, res) => {
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const startOfYear = moment().startOf('year').format('YYYY-MM-DD');

    const dashboardSql = `
            WITH employee_stats AS (
                SELECT COUNT(*) as total_employees,
                    SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as new_employees FROM employees
            ),
            attendance_today AS (
                SELECT 
                    COUNT(CASE WHEN status = 1 THEN 1 END) as on_time_today,
                    COUNT(CASE WHEN status = 3 THEN 1 END) as absent_today
                FROM attendances
                WHERE DATE(created_at) = ?
            ),
            attendance_yesterday AS (
                SELECT 
                    COUNT(CASE WHEN status = 1 THEN 1 END) as on_time_yesterday
                FROM attendances
                WHERE DATE(created_at) = ?
            ),
            ytd_absences AS (
                SELECT 
                    COUNT(CASE WHEN status = 3 THEN 1 END) as total_absences
                FROM attendances
                WHERE DATE(created_at) BETWEEN ? AND ?
            )
            SELECT 
                es.total_employees,
                es.new_employees,
                at.on_time_today,
                at.absent_today,
                ay.on_time_yesterday,
                ya.total_absences
            FROM employee_stats es
            CROSS JOIN attendance_today at
            CROSS JOIN attendance_yesterday ay
            CROSS JOIN ytd_absences ya;
        `;

    const dashboardStats = await query(dashboardSql, [today, today, yesterday, startOfYear, today]);
    const stats = dashboardStats[0];

    const onTimeChange = stats.on_time_yesterday ?
        ((stats.on_time_today - stats.on_time_yesterday) / stats.on_time_yesterday * 100).toFixed(1) : 0;

    const workingDaysSoFar = moment().diff(moment().startOf('year'), 'days');
    const avgYtdAbsenceRate = ((stats.total_absences / (stats.total_employees * workingDaysSoFar)) * 100).toFixed(1);
    const todayAbsenceRate = ((stats.absent_today / stats.total_employees) * 100).toFixed(1);
    const absenceChange = (todayAbsenceRate - avgYtdAbsenceRate).toFixed(1);

    return res.json({
        success: true,
        data: {
            timestamp: moment().format('HH:mm:ss A'),
            date: moment().format('MMM DD, YYYY'),
            stats: {
                total_employees: {
                    count: stats.total_employees,
                    new_today: stats.new_employees
                },
                on_time: {
                    count: stats.on_time_today,
                    change_from_yesterday: `${onTimeChange}%`
                },
                absent: {
                    count: stats.absent_today,
                    change_from_ytd: `${absenceChange}%`
                }
            }
        }
    });
};

exports.getPerformanceStats = async (req, res) => {
    const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');

    const performanceSql = `
            WITH daily_stats AS (
                SELECT 
                    DATE(created_at) as work_date,
                    COUNT(*) as total_attendance,
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, checkin_time, checkout_time) >= 8 THEN 1 
                        ELSE 0 
                    END) as full_day,
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, checkin_time, checkout_time) < 8 
                        AND TIMESTAMPDIFF(HOUR, checkin_time, checkout_time) >= 4 THEN 1 
                        ELSE 0 
                    END) as half_day,
                    SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as absent,
                    (SELECT COUNT(*) 
                     FROM leaves 
                     WHERE DATE(created_at) = DATE(a.created_at) 
                     AND status = 2) as approved_leaves
                FROM attendances a
                WHERE DATE(created_at) BETWEEN ? AND ?
                GROUP BY DATE(created_at)
            )
            SELECT 
                SUM(full_day) as total_full_day,
                SUM(half_day) as total_half_day,
                SUM(absent) as total_absent,
                SUM(approved_leaves) as total_permission,
                COUNT(*) * (SELECT COUNT(*) FROM employees) as total_possible_days
            FROM daily_stats;
        `;

    const performanceStats = await query(performanceSql, [thirtyDaysAgo, today]);
    const stats = performanceStats[0];

    const total = stats.total_possible_days;

    const percentages = {
        full_day: ((stats.total_full_day / total) * 100).toFixed(1),
        half_day: ((stats.total_half_day / total) * 100).toFixed(1),
        absent: ((stats.total_absent / total) * 100).toFixed(1),
        permission: ((stats.total_permission / total) * 100).toFixed(1)
    };

    return res.json({
        success: true,
        data: {
            from_date: thirtyDaysAgo,
            to_date: today,
            percentages
        }
    });
};

exports.ownOvertimeStatistics = async (req, res) => {
    const user_id = req.user?.id;
    let { date } = req.query;

    if (!user_id) return res.status(400).json({ success: false, message: "User ID is required" });

    const targetDate = date ? new Date(date) : new Date();

    const sql = `
            SELECT 
                COUNT(ot.id) as total_record,
                SUM(CASE WHEN ot.approval_status = 1 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN ot.approval_status = 2 THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN ot.approval_status = 3 THEN 1 ELSE 0 END) as rejected
            FROM over_time as ot
            INNER JOIN employees as emp ON ot.employee_id = emp.id
            INNER JOIN users as user ON emp.user_id = user.id
            WHERE user.id = ? AND DATE(ot.checkin_time) BETWEEN ? AND ?
        `;

    const firstDay = getFirstDayOfMonth(targetDate);
    const lastDay = formatDate(targetDate);

    const [result] = await query(sql, [user_id, firstDay, lastDay]);
    // console.log(user_id, firstDay, lastDay);


    return res.status(200).json({
        success: true,
        data: {
            total_record: result.total_record,
            pending: result.pending,
            approved: result.approved,
            rejected: result.rejected
        }
    });
};

exports.payrollStatistics = async (req, res) => {
    let { date } = req.query;
    if (!date) date = formatDate(new Date());

    const payrollSQL = `
            SELECT 
                SUM(e.base_salary)/(SELECT COUNT(*) FROM employees) AS average_salary,
                SUM(net_salary) AS total_payroll_cost,
                SUM(CASE WHEN p.status = 2 THEN net_salary ELSE 0 END) AS total_paid_salary,
                SUM(CASE WHEN p.status = 1 AND DATE(p.created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN p.status = 2 AND DATE(p.created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) AS paid
            FROM payrolls as p INNER JOIN employees as e ON p.employee_id = e.id;
        `;

    const [result] = await query(payrollSQL, [getFirstDayOfMonth(date), getLastDayOfMonth(date), getFirstDayOfMonth(date), getLastDayOfMonth(date), getFirstDayOfMonth(date), getLastDayOfMonth(date)]);


    res.status(200).json({
        success: true,
        data: result
    });

};

exports.countCurrentAttendance = async (req, res) => {
    let { date } = req.query;
    if (!date) date = formatDate(new Date());

    // Optimized total employees, gender count, and positions query
    const [total] = await query(`
        SELECT 
            COUNT(*) AS total_employee,
            SUM(CASE WHEN gender = 1 THEN 1 ELSE 0 END) AS male,
            SUM(CASE WHEN gender = 2 THEN 1 ELSE 0 END) AS female,
            SUM(CASE WHEN position_id = 1 THEN 1 ELSE 0 END) AS Web,
            SUM(CASE WHEN position_id = 2 THEN 1 ELSE 0 END) AS Mobile,
            SUM(CASE WHEN position_id = 3 THEN 1 ELSE 0 END) AS HR,
            SUM(CASE WHEN position_id = 4 THEN 1 ELSE 0 END) AS Accountance
        FROM employees
    `);

    // Optimized net salary query
    const [net_salary] = await query(`
        SELECT SUM(net_salary) AS total_salary
        FROM payrolls
        WHERE DATE_FORMAT(paydate, '%Y%m') = 
            CASE 
                WHEN DAY(CURRENT_DATE) = DAY(LAST_DAY(CURRENT_DATE)) 
                THEN DATE_FORMAT(CURRENT_DATE, '%Y%m')
                ELSE DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y%m')
            END
    `);

    // Optimized OT query
    const [total_OT] = await query(`
        SELECT 
            ROUND(SUM(TIMESTAMPDIFF(MINUTE, checkin_time, checkout_time) / 60.0), 2) AS total_hours
        FROM over_time
        WHERE YEAR(checkin_time) = YEAR(CURRENT_DATE) 
        AND MONTH(checkin_time) = MONTH(CURRENT_DATE)
    `);

    // Optimized attendance statistics
    const [attendance_month] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM leaves WHERE YEAR(start_date) = YEAR(CURRENT_DATE) AND MONTH(start_date) = MONTH(CURRENT_DATE)) AS leave_total,
            SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS late_count,
            SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS absent_count,
            COUNT(*) AS attendance_total
        FROM attendances
        WHERE YEAR(created_at) = YEAR(CURRENT_DATE) AND MONTH(created_at) = MONTH(CURRENT_DATE)
    `);

    // Optimized daily check-in query
    const checkTotal = await query(`
      WITH RECURSIVE date_sequence AS (
    SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') as checkin_date
    UNION ALL
    SELECT DATE_ADD(checkin_date, INTERVAL 1 DAY)
    FROM date_sequence
    WHERE checkin_date < CURRENT_DATE
),
checkin_counts AS (
    SELECT 
        DATE(checkin_time) as checkin_date,
        COUNT(*) as total_checked_in
    FROM attendances
    WHERE checkin_time IS NOT NULL
      AND checkin_time >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
      AND checkin_time < DATE_FORMAT(CURRENT_DATE + INTERVAL 1 DAY, '%Y-%m-%d')
    GROUP BY DATE(checkin_time)
)
SELECT 
    COALESCE(c.checkin_date, d.checkin_date) as checkin_date,
    COALESCE(c.total_checked_in, 0) as total_checked_in
FROM date_sequence d
LEFT JOIN checkin_counts c
    ON d.checkin_date = c.checkin_date
ORDER BY d.checkin_date;
    `);

    // Optimized attendance breakdown & department/position count
    const [result] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM attendances WHERE status = 2 AND DATE(checkin_time) = ?) AS on_time,
            (SELECT COUNT(*) FROM attendances WHERE status = 1 AND DATE(checkin_time) = ?) AS late,
            (SELECT COUNT(*) FROM leaves WHERE ? BETWEEN start_date AND end_date AND status = 2) AS on_leave,
            (SELECT COUNT(*) FROM leaves WHERE ? BETWEEN start_date AND end_date AND status = 1) AS pending_leave,
            (SELECT COUNT(*) FROM departments) AS department_count,
            (SELECT COUNT(*) FROM positions) AS position_count
    `, [date, date, date, date]);

    const present = result.on_time + result.late + result.on_leave;
    const absent = total.total_employee - present;

    return res.status(200).json({
        total_employees: total,
        total_salary: net_salary,
        total_ot: total_OT,
        attendance: attendance_month,
        check_daily: checkTotal,
        totalPosition: { Web: total.Web, Mobile: total.Mobile, HR: total.HR },
        department: result.department_count,
        position: result.position_count,
        present,
        on_time: result.on_time,
        late: result.late,
        on_leave: result.on_leave,
        pending_leave: result.pending_leave,
        absent
    });
};



exports.getPerformanceStatByID = async (req, res) => {
    const emp_id = req.params.id;
    let { startDate, endDate } = req.query;
    let workdays = new Set();

    if (!emp_id) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!startDate && endDate) {
        return res.status(400).json({ success: false, message: "Start date is required" });
    }
    if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
        return res.status(400).json({ success: false, message: "Start date must be before end date" });
    }

    const today = new Date();
    const currentDate = formatDate(today);

    if (!startDate) {
        startDate = getFirstDayOfMonth(currentDate);
        endDate = currentDate;
    }
    if (!endDate) {
        endDate = getLastDayOfMonth(startDate);
    }

    endDate = new Date(endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toISOString().split('T')[0];
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isHoliday = hd.isHoliday(d);

        if (!isWeekend && !isHoliday) {
            workdays.add(formattedDate);
        }
    }

    const performanceSql = `
    WITH daily_stats AS (
        SELECT 
            DATE(attendances.created_at) as work_date,
            COUNT(*) as total_attendance,
            SUM(CASE WHEN attendances.status = 2 THEN 1 ELSE 0 END) as full_day,
            SUM(CASE WHEN attendances.status = 1 THEN 1 ELSE 0 END) as half_day,
            SUM(CASE WHEN attendances.status = 3 THEN 1 ELSE 0 END) as late
        FROM attendances
        INNER JOIN employees ON attendances.employee_id = employees.id
        INNER JOIN users ON employees.user_id = users.id
        WHERE employees.id = ? AND DATE(attendances.created_at) BETWEEN ? AND ?
        GROUP BY DATE(attendances.created_at)
    ),
    leave_stats AS (
        SELECT 
            DATE(leaves.start_date) as leave_date, 
            COUNT(*) as approved_leaves
        FROM leaves
        INNER JOIN employees ON leaves.employee_id = employees.id 
        INNER JOIN users ON employees.user_id = users.id
        WHERE employees.id = ? AND leaves.status = 2 AND DATE(leaves.start_date) BETWEEN ? AND ?
        GROUP BY DATE(leaves.start_date)
    )
SELECT 
    COALESCE(SUM(ds.full_day), 0) as total_full_day,
    COALESCE(SUM(ds.half_day), 0) as total_half_day,
    COALESCE(SUM(ds.late), 0) as total_late,
    COALESCE(SUM(ls.approved_leaves), 0) as total_permission,
    COUNT(DISTINCT ds.work_date) as total_present_days,
    COUNT(DISTINCT ls.leave_date) as total_leave_days
FROM daily_stats ds
LEFT JOIN leave_stats ls ON ds.work_date = ls.leave_date;
          `;

    const [performance] = await query(performanceSql, [emp_id, startDate, formatDate(endDate), emp_id, startDate, formatDate(endDate)]);

    let { total_full_day, total_half_day, total_late, total_permission, total_present_days, total_leave_days } = performance;
    // console.log(startDate, endDate, performance);

    let total_workdays = workdays.size;
    let total_absent_days = total_workdays - (total_present_days + total_leave_days);

    return res.status(200).json({
        success: true,
        data: {
            from: startDate,
            to: formatDate(endDate),
            workdays: total_workdays,
            present: total_present_days,
            full_day: total_full_day,
            half_day: total_half_day,
            late: total_late,
            premission: total_permission,
            absent: total_absent_days,
        },
    });
};

exports.getOwnPerformance = async (req, res) => {
    const user_id = req.user.id;
    let { startDate, endDate } = req.query;
    let workdays = new Set();

    if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!startDate && endDate) {
        return res.status(400).json({ success: false, message: "Start date is required" });
    }
    if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
        return res.status(400).json({ success: false, message: "Start date must be before end date" });
    }

    const today = new Date();
    const currentDate = formatDate(today);

    if (!startDate) {
        startDate = getFirstDayOfMonth(currentDate);
        endDate = currentDate;
    }
    if (!endDate) {
        endDate = getLastDayOfMonth(startDate);
    }

    endDate = new Date(endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toISOString().split('T')[0];
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isHoliday = hd.isHoliday(d);

        if (!isWeekend && !isHoliday) {
            workdays.add(formattedDate);
        }
    }

    const performanceSql = `
    WITH daily_stats AS (
        SELECT 
            DATE(attendances.created_at) as work_date,
            COUNT(*) as total_attendance,
            SUM(CASE WHEN attendances.status = 2 THEN 1 ELSE 0 END) as full_day,
            SUM(CASE WHEN attendances.status = 1 THEN 1 ELSE 0 END) as half_day,
            SUM(CASE WHEN attendances.status = 3 THEN 1 ELSE 0 END) as late
        FROM attendances
        INNER JOIN employees ON attendances.employee_id = employees.id
        INNER JOIN users ON employees.user_id = users.id
        WHERE users.id = ? AND DATE(attendances.created_at) BETWEEN ? AND ?
        GROUP BY DATE(attendances.created_at)
    ),
    leave_stats AS (
        SELECT  
            DATE(leaves.start_date) as leave_date, 
            COUNT(*) as approved_leaves
        FROM leaves
        INNER JOIN employees ON leaves.employee_id = employees.id 
        INNER JOIN users ON employees.user_id = users.id
        WHERE users.id = ? AND leaves.status = 2 AND DATE(leaves.start_date) BETWEEN ? AND ?
        GROUP BY DATE(leaves.start_date)
    )
SELECT 
    COALESCE(SUM(ds.full_day), 0) as total_full_day,
    COALESCE(SUM(ds.half_day), 0) as total_half_day,
    COALESCE(SUM(ds.late), 0) as total_late,
    COALESCE(SUM(ls.approved_leaves), 0) as total_permission,
    COUNT(DISTINCT ds.work_date) as total_present_days,
    COUNT(DISTINCT ls.leave_date) as total_leave_days
FROM daily_stats ds
LEFT JOIN leave_stats ls ON ds.work_date = ls.leave_date;
          `;

    const [performance] = await query(performanceSql, [user_id, startDate, formatDate(endDate), user_id, startDate, formatDate(endDate)]);

    let { total_full_day, total_half_day, total_late, total_permission, total_present_days, total_leave_days } = performance;

    let total_workdays = workdays.size;
    let total_absent_days = total_workdays - (total_present_days + total_leave_days);

    return res.status(200).json({
        success: true,
        data: {
            from: startDate,
            to: formatDate(endDate),
            workdays: total_workdays,
            present: total_present_days,
            full_day: total_full_day,
            half_day: total_half_day,
            late: total_late,
            premission: total_permission,
            absent: total_absent_days,
        },
    });
};

exports.getMepayrolls = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }

            let id = decodedToken.id;
            const myArr = [id];


            const { paydate } = req.query;

            let paydateCondition = '';
            if (paydate) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(paydate)) {
                    return res.status(400).json({ message: "Invalid paydate format. Use YYYY-MM-DD." });
                }
                paydateCondition = `AND p.paydate = '${paydate}'`;
            } else {
                paydateCondition = `AND p.paydate = LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`;
            }

            const payroll = await query(`
                SELECT 
                    e.id,
                    e.base_salary,
            
                    CASE
                        WHEN e.base_salary < 325 THEN 0
                        WHEN e.base_salary >= 325 AND e.base_salary < 500 THEN (e.base_salary * 0.5) - 18.7
                        WHEN e.base_salary >= 500 AND e.base_salary < 2125 THEN (e.base_salary * 0.10) - 43.75
                        WHEN e.base_salary >= 2125 AND e.base_salary < 3125 THEN (e.base_salary * 0.15) - 150
                        ELSE (e.base_salary * 0.20) - 306.25
                    END AS tax_amount,
            
                    CASE
                        WHEN e.base_salary < 325 THEN 0
                        WHEN e.base_salary >= 325 AND e.base_salary < 500 THEN 5
                        WHEN e.base_salary >= 500 AND e.base_salary < 2125 THEN 10
                        WHEN e.base_salary >= 2125 AND e.base_salary < 3125 THEN 15
                        ELSE 20
                    END AS tax_percentage,
            
                    COALESCE(ot.total_status_1_requests, 0) AS total_status_1_requests,
            
                    p.ot_salary,
                    p.net_salary,
                    DATE_FORMAT(CONVERT_TZ(p.paydate, '+00:00', '+07:00'), '%Y-%m-%d') AS paydate,
                    p.status
            
                FROM employees e
            
                LEFT JOIN (
                    SELECT 
                        employee_id, 
                        COUNT(*) AS total_status_1_requests
                    FROM over_time
                    WHERE 
                        YEAR(date) = YEAR('${paydate}') 
                        AND MONTH(date) = MONTH('${paydate}')
                        AND approval_status = 1
                    GROUP BY employee_id
                ) ot ON e.id = ot.employee_id
            
                INNER JOIN payrolls p ON e.id = p.employee_id 
                AND p.status = 2 
                ${paydateCondition}  
            
                WHERE e.id = ?;
            `, myArr);


            if (!payroll || payroll.length === 0) {
                return res.status(404).json({ result: false, message: "No payroll data found" });
            }

            return res.status(200).json({ result: true, message: "Get statistic payroll successfully", data: payroll });
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "An error occurred", error: err.message });
    }
};

exports.getTotalLeave = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }

            let id = decodedToken.id;
            const leaveQuery = `
                SELECT 
                    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS Pending,
                    SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS Approved,
                    SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS Reject
                FROM leaves
                WHERE employee_id = ?
                AND YEAR(end_date) = YEAR(CURDATE());
            `;

            let total = await query(leaveQuery, [id]); // Ensure array format

            return res.status(200).json({ result: true, message: "Get status leave successfully", data: total });
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "An error occurred", error: err.message });
    }
};


exports.getLeaveFilter = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }

            let id = decodedToken.id;
            const status = req.query.status ? parseInt(req.query.status) : null;

            // Query to get the count of leave requests by status
            const totalQuery = `
                SELECT 
                    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS Pending,
                    SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS Approved,
                    SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS Rejected
                FROM leaves
                WHERE employee_id = ?;
            `;

            let total = await query(totalQuery, [id]);

            // Query to fetch leave records based on status
            const leaveQuery = `
                SELECT 
                    leave_reason, 
                    leave_type, 
                    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                    DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                    status
                FROM leaves
                WHERE (status = ? OR ? IS NULL)
                AND employee_id = ?;
            `;

            const results = await query(leaveQuery, [status, status, id]);

            return res.status(200).json({
                result: true,
                message: "Leaves retrieved successfully",
                data: {
                    totals: total[0], 
                    rows: results
                }
            });
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "An error occurred", error: err.message });
    }
};

exports.getTotalOT = async (req,res)=>{
    try {
        const OTQuery = `
                    SELECT 
            SUM(CASE WHEN approval_status = 1 THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN approval_status = 2 THEN 1 ELSE 0 END) as rejected_count,
            SUM(CASE WHEN approval_status = 3 THEN 1 ELSE 0 END) as pending_count
        FROM 
            over_time
        WHERE 
            date = CURRENT_DATE;
        `
    let data =  await query(OTQuery);
        return res.status(200).json({
            result: true,
            message: "Total OT retrieved successfully",
            data
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "An error occurred", error: err.message });
    }
}

exports.getTotalOTmontly = async (req, res) => {
    try {
        let date = req.query.date; 
        if (!date) {
            date = null; 
        }

        const OTQuery = `
            SELECT 
                SUM(CASE WHEN approval_status = 1 THEN 1 ELSE 0 END) AS approved_count,  -- Approved of that month
                SUM(CASE WHEN approval_status = 2 THEN 1 ELSE 0 END) AS rejected_count,  -- Reject of that month
                ROUND(SUM(TIMESTAMPDIFF(MINUTE, checkin_time, checkout_time) / 60.0), 2) AS total_hours  -- Total hours of that month
            FROM 
                over_time
            WHERE 
                MONTH(checkin_time) = MONTH(COALESCE(?, CURRENT_DATE))  -- Match month of param or current month
                AND YEAR(checkin_time) = YEAR(COALESCE(?, CURRENT_DATE))  -- Match year of param or current year
        `;

        let data = await query(OTQuery, [date, date]);

        return res.status(200).json({
            result: true,
            message: "Total OT retrieved monthly successfully",
            data: data
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ 
            message: "An error occurred", 
            error: err.message 
        });
    }
};