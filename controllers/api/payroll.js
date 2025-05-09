const { generatePayroll, getAllPayrolls, getPayrollByID, deletePayroll, UpdatePayroll, getPayrollByUser } = require('../../resources/payroll');

exports.generatePayroll = async (req, res) => {
    try {
        await generatePayroll(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getPayrolls = async (req, res) => {
    try {
        await getAllPayrolls(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getPayrollByID = async (req, res) => {
    try {
        await getPayrollByID(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.deletePayroll = async (req, res) => {
    try {
        await deletePayroll(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.updatePayroll = async (req, res) => {
    try {
        await UpdatePayroll(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getPayrollByUser = async (req, res) => {
    try {
        await getPayrollByUser(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}