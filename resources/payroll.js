const { query } = require('../config/db');
const { calculateTax, getFirstDayOfMonth, getLastDayOfMonth } = require('../utils/payroll');
const { formatDate, formatDateTime } = require('../utils/format');
const { Pagination } = require('../utils/pagination');

exports.generatePayroll = async (req, res) => {
    let { date } = req.body;

    try {

        const employeeSQL = "SELECT id, base_salary FROM employees";
        const employees = await query(employeeSQL);

        for (const emp of employees) {

            const currentDate = date ? new Date(date) : new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const otSQL = `SELECT id, date, hour, ot_pay FROM over_time WHERE employee_id = ? AND date BETWEEN ? AND ? AND approval_status = 2`;
            const overtimeRecords = await query(otSQL, [emp.id, formatDate(firstDayOfMonth), formatDate(lastDayOfMonth)]);

            if (overtimeRecords.length === 0) {
                continue;
            }

            let ot_salary = 0;

            overtimeRecords.forEach(record => {
                ot_salary += record.ot_pay;
            });

            const total_salary = Number((emp.base_salary + ot_salary).toFixed(2));
            const tax = calculateTax(total_salary);
            const net_salary = total_salary - tax;

            const insertPayrollSQL = `INSERT INTO payrolls (employee_id ,ot_salary ,net_salary) VALUES (?, ?, ?)`;
            await query(insertPayrollSQL, [emp.id, ot_salary, net_salary]);
        }

        return res.status(200).json({
            success: true,
            message: 'Payroll generated successfully'
        });

    } catch (error) {
        console.error('Payroll generation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating payroll',
            error: error.message
        });
    }
};

exports.getAllPayrolls = async (req, res) => {
    let { name, date, page, per_page, sort = 'desc' } = req.query;
        let values = [];

        page = parseInt(page) || 1;
        per_page = parseInt(per_page) || 10;

        if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
            return res.status(400).json({ success: false, message: 'Invalid page number or per_page' });
        }

        if (!['asc', 'desc'].includes(sort.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Sort must be either "asc" or "desc"' });
        }

        const countSql = `SELECT COUNT(*) as total FROM payrolls`;
        const totalRecords = await query(countSql, values);
        const totalPages = Math.ceil(totalRecords[0].total / per_page);

        const pagination = {
            current_page: page,
            per_page,
            total_pages: totalPages,
            total_records: totalRecords[0].total
        };

        const payrollSQL = `
            SELECT 
                emp.id AS emp_id,
                CONCAT(user.first_name, ' ', user.last_name) AS full_name,
                emp.base_salary,
                pos.name AS position,
                pay.id AS payroll_id,
                pay.bonus,
                pay.ot_salary,
                pay.net_salary,
                pay.paydate,
                pay.created_at
            FROM employees emp
            INNER JOIN users user ON emp.user_id = user.id  
            INNER JOIN positions pos ON emp.position_id = pos.id
            INNER JOIN payrolls pay ON emp.id = pay.employee_id
            ORDER BY pay.created_at ${sort.toUpperCase()}
            LIMIT ? OFFSET ?`;

        values.push(per_page, (page - 1) * per_page);
        const payroll = await query(payrollSQL, values);

        if (payroll.length === 0) {
            return res.status(404).json({ success: false, message: 'No payroll records found' });
        }

        const formattedPayrolls = payroll.map(pay => ({
            employees: {
                id: pay.emp_id,
                full_name: pay.full_name,
                position: pay.position
            },
            payrolls: {
                id: pay.payroll_id,
                base_salary: pay.base_salary,
                tax: calculateTax(pay.base_salary),
                bonus: pay.bonus,
                ot_salary: pay.ot_salary,
                net_salary: pay.net_salary,
                paydate: formatDate(pay.paydate),
                status: pay.paydate ? 1 : 0,
                created_at: formatDateTime(pay.created_at),
            }
        }));

        return res.status(200).json({
            success: true,
            pagination,
            data: formattedPayrolls
        });
};


exports.getPayrollByID = async (req, res) => {
    const id = req.params.id;
    let { date, page, per_page , sort = 'desc' } = req.query;
    let values = [id];

    if(!page) page = 1;
    if(!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page number or per_page' });
    }

    if (!['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Sort must be either "asc" or "desc"' });
    }

    const currentDate = new Date();
    const firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));

    let fromDate = date ? getFirstDayOfMonth(date) : firstDayOfMonth;
    let toDate = date ? getLastDayOfMonth(date) : lastDayOfMonth;

    let baseSQL = `
        FROM employees emp
        INNER JOIN users user ON emp.user_id = user.id  
        INNER JOIN positions pos ON emp.position_id = pos.id 
        INNER JOIN payrolls pay ON emp.id = pay.employee_id
        WHERE emp.id = ?`;

    if (date) {
        baseSQL += ` AND DATE(pay.created_at) = ?`;
        values.push(date);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSQL}`;
    const pagination = await Pagination(countSql, values, page, per_page);

    const payrollSQL = `
        SELECT 
            emp.id AS emp_id,
            CONCAT(user.first_name, ' ', user.last_name) AS full_name,
            emp.base_salary,
            pos.name AS position,
            pay.id AS payroll_id,
            pay.bonus,
            pay.ot_salary,
            pay.net_salary,
            pay.paydate,
            pay.created_at,
            pay.updated_at
        ${baseSQL}
        ORDER BY pay.created_at ${sort.toUpperCase()}
        LIMIT ? OFFSET ?`;

    values.push(per_page, (page - 1) * per_page);

    const payroll = await query(payrollSQL, values);

    if (payroll.length === 0) {
        return res.status(404).json({ success: false, message: 'No payroll records found' });
    }

    const formattedPayrolls = payroll.map(pay => ({
        employees: {
            id: pay.emp_id,
            full_name: pay.full_name,
            position: pay.position
        },
        payrolls: {
            id: pay.payroll_id,
            from: fromDate,
            to: toDate,
            base_salary: pay.base_salary,
            tax: calculateTax(pay.base_salary),
            bonus: pay.bonus,
            ot_salary: pay.ot_salary,
            net_salary: pay.net_salary,
            paydate: formatDate(pay.paydate),
            status: (pay.paydate === null) ? 0 : 1,
            created_at: formatDateTime(pay.created_at),
            updated_at: formatDateTime(pay.updated_at),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination,
        data: formattedPayrolls
    });
};


exports.deletePayroll = async (req, res) => {
    const id = req.params.id;

    const sql = `DELETE FROM payrolls WHERE id =?`;
    const result = await query(sql, id);

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Payroll not found'
        });
    }
    return res.status(200).json({
        success: true,
        message: 'Payroll deleted successfully'
    });
}


exports.UpdatePayroll = async (req, res) => {
    const id = req.params.id;
    let { bonus, paydate } = req.body;

    let fields = [];
    let values = []

    if(!id){
        return res.status(400).json({
            success: false,
            message: 'Payroll ID is required'
        });
    }

    if(bonus){
        fields.push('bonus =?');
        values.push(bonus);
    }

    if(paydate){
        fields.push('paydate =?');
        values.push(paydate);
    }

    if(fields.length === 0){
        return res.status(400).json({
            success: false,
            message: 'At least one field is required to update'
        });
    }
    values.push(id);
    console.log(fields, values);
    

    // net_salary will be updated on bonus changes using trigger in database
    const sql = `UPDATE payrolls SET ${fields.join(', ')} WHERE id =?`;
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Payroll not found'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Payroll updated successfully'
    });

}


exports.getPayrollByUser = async (req, res) => {
    const id = req.user.id;
    let { date, page, per_page , sort = 'desc' } = req.query;
    let values = [id];

    if(!page) page = 1;
    if(!per_page) per_page = 10;

    page = parseInt(page);
    per_page = parseInt(per_page);

    if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page number or per_page' });
    }

    if (!['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Sort must be either "asc" or "desc"' });
    }

    const currentDate = new Date();
    const firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));

    let fromDate = date ? getFirstDayOfMonth(date) : firstDayOfMonth;
    let toDate = date ? getLastDayOfMonth(date) : lastDayOfMonth;

    let baseSQL = `
        FROM employees emp
        INNER JOIN users user ON emp.user_id = user.id  
        INNER JOIN positions pos ON emp.position_id = pos.id 
        INNER JOIN payrolls pay ON emp.id = pay.employee_id
        WHERE user.id = ?`;

    if (date) {
        baseSQL += ` AND DATE(pay.created_at) = ?`;
        values.push(date);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSQL}`;
    const pagination = await Pagination(countSql, values, page, per_page);
    const totalRecords = await query(countSql, values);
    const totalPages = Math.ceil(totalRecords[0].total / per_page);

    const payrollSQL = `
        SELECT 
            emp.id AS emp_id,
            CONCAT(user.first_name, ' ', user.last_name) AS full_name,
            emp.base_salary,
            pos.name AS position,
            pay.id AS payroll_id,
            pay.bonus,
            pay.ot_salary,
            pay.net_salary,
            pay.paydate,
            pay.created_at,
            pay.updated_at
        ${baseSQL}
        ORDER BY pay.created_at ${sort.toUpperCase()}
        LIMIT ? OFFSET ?`;

    values.push(per_page, (page - 1) * per_page);

    const payroll = await query(payrollSQL, values);

    if (payroll.length === 0) {
        return res.status(404).json({ success: false, message: 'No payroll records found' });
    }

    const formattedPayrolls = payroll.map(pay => ({
        employees: {
            id: pay.emp_id,
            full_name: pay.full_name,
            position: pay.position
        },
        payrolls: {
            id: pay.payroll_id,
            from: fromDate,
            to: toDate,
            base_salary: pay.base_salary,
            tax: calculateTax(pay.base_salary),
            bonus: pay.bonus,
            ot_salary: pay.ot_salary,
            net_salary: pay.net_salary,
            paydate: formatDate(pay.paydate),
            status: (pay.paydate === null) ? 0 : 1,
            created_at: formatDateTime(pay.created_at),
            updated_at: formatDateTime(pay.updated_at),
        }
    }));

    return res.status(200).json({
        success: true,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords[0].total
        },
        data: formattedPayrolls
    });
};