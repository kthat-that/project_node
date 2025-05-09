const { getDashboardStats, getPerformanceStats, getPerformanceStatByID, getOwnPerformance, countCurrentAttendance, payrollStatistics, ownOvertimeStatistics, getMepayrolls, getTotalLeave, getLeaveFilter, getTotalOT, getTotalOTmontly } = require('../../resources/statistic');

exports.getDashboardStats = async (req, res) => {
    try {
        await getDashboardStats(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getPerformanceStats = async (req, res) => {
    try {
        await getPerformanceStats(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getPerformanceStatByID = async (req, res) => {
    try {
        await getPerformanceStatByID(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getOwnPerformance = async (req, res) => {
    try {
        await getOwnPerformance(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.countCurrentAttendance = async (req, res) => {
    try {
        await countCurrentAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.payrollStatistics = async (req, res) => {
    try {
        await payrollStatistics(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.overtimeStatistics = async (req, res) => {
    try {
        await ownOvertimeStatistics(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getMepayroll = async (req, res) => {
    try {
        await getMepayrolls(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getTotalLeave = async (req, res) => {
    try {
        await getTotalLeave(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getLeaveFilter = async (req, res) => {
    try {
        await getLeaveFilter(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getTotalOT = async (req, res) => {
    try {
        await getTotalOT(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getTotalOTMonthly = async (req, res) => {
    try {
        await getTotalOTmontly(req, res);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
