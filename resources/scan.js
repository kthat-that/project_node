const { query } = require('../config/db');
const { checkLocation, calculateHours } = require('../utils/scan');
const { calculateOvertimeRate, calculateHourlyRate } = require('../utils/payroll');
const { formatDate } = require('../utils/format');

exports.Scan = async (req, res) => {
    const id = req.user.id;
    const { location, qrData } = req.body;
    
    if(qrData && qrData != "https://votmean.ems.linkpc.net/user/check-scanner"){
        return res.status(400).json({ success: false, message: 'Invalid QR Code' });
    }

    if (!id || !location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return res.status(400).json({ success: false, message: 'Missing or invalid fields: id or location.' });
    }

    let sql = "select employees.id as id, base_salary as salary from employees inner join users on employees.user_id = users.id where users.id = ?";
    const employee_id = await query(sql, id);

    const { latitude, longitude } = location;

    const allowedLocation = { latitude: 11.572410762813925, longitude: 104.89336936109613, radius: 1000 };

    if (!checkLocation(latitude, longitude, allowedLocation)) {
        return res.status(403).json({ success: false, message: 'You are not within the allowed location (1 km radius).' });
    }

    const options = { timeZone: "Asia/Phnom_Penh", hour12: false };
    const nowCambodia = new Date().toLocaleString("en-US", options);
    const cambodiaDate = new Date(nowCambodia);


    const hour = cambodiaDate.getHours();
    const minute = cambodiaDate.getMinutes();
    const today = cambodiaDate.toISOString().split('T')[0];

    try {
        const existingAttendance = await query(
            'SELECT * FROM attendances WHERE employee_id = ? AND DATE(checkin_time) = ?',
            [employee_id[0].id, today]
        );

        if (existingAttendance.length === 0) {
            let status;

            if (hour >= 7 && hour <= 8) {
                status = 2; // Present full days
            } else if (hour > 8 && hour <= 9) {
                status = 1; // Late
            } else if (hour >= 10 && hour < 13) {
                return res.status(400).json({   
                    success: false,
                    message: 'Cannot check in after 10 AM. Try again after 1 PM.',
                });
            } else if (hour >= 13 && hour < 14) {
                status = 3; // Absent Half Day
            } else if (hour >= 14) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot check in after 2 PM.',
                });
            } else {
                return res.status(400).json({ success: false, message: 'Outside valid check-in times.' });
            }

            await query(
                'INSERT INTO attendances (employee_id, status, checkin_time) VALUES (?, ?, ?)',
                [employee_id[0].id, status, cambodiaDate]
            );

            return res.status(200).json({ success: true, message: 'Check-in recorded successfully' });

        } else {

            const record = existingAttendance[0];


            if (record.checkout_time != null) {

                const overtimeRequest = await query(
                    "SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, checkin_time, approval_status FROM over_time WHERE employee_id =? AND date =?",
                    [employee_id[0].id, today]
                );

                const request = overtimeRequest[0];

                if (!request) {
                    return res.status(400).json({
                        success: false,
                        message: "You have not request for overtime today.",
                    });
                }

                switch (request.approval_status) {
                    case 1:
                        return res.status(200).json({
                            success: false,
                            message: "Your overtime request is pending approval.",
                        });

                    case 3:
                        return res.status(400).json({
                            success: false,
                            message: "Your overtime request has been denied.",
                        });

                    case 2:
                        if (!request.checkin_time) {
                            await query("UPDATE over_time SET checkin_time = ? WHERE employee_id = ? AND date = ?", [cambodiaDate, employee_id[0].id, request.date]);
                            return res.status(200).json({
                                success: true,
                                message: "Check-in overtime recorded successfully.",
                            });
                        }
                        if (!request.checkout_time) {

                            const hour = Number(calculateHours(request.checkin_time, cambodiaDate).toFixed(2))
                            const ot_pay = Number((hour * calculateOvertimeRate(formatDate(cambodiaDate)) * calculateHourlyRate(employee_id[0].salary)).toFixed(2));

                            const sql = "UPDATE over_time SET checkout_time = ?, hour = ? , ot_pay = ? WHERE employee_id = ? AND checkin_time = ?";
                            await query(sql, [cambodiaDate, hour, ot_pay, employee_id[0].id, request.checkin_time]);
                            return res.status(200).json({
                                success: true,
                                message: "Check-out overtime recorded successfully.",
                            });
                        }
                        return res.status(400).json({
                            success: false,
                            message: "You have already checked out for overtime today.",
                        });

                    default:
                        return res.status(400).json({
                            success: false,
                            message: "You have already requested overtime today.",
                        });
                }
            }

            if (!(hour >= 17 && hour <= 18)) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out is only allowed between 5 PM and 6 PM.',
                });
            }

            await query(
                'UPDATE attendances SET checkout_time = ? WHERE id = ?',
                [cambodiaDate, record.id]
            );

            return res.status(200).json({ success: true, message: 'Check-out recorded successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error processing attendance.' });
    }
};