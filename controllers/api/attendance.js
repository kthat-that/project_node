const { getAllAttendance, getAttendanceByID, AddAttendance, updateAttendance, deleteAttendance, getOwnAttendance} = require('../../resources/attendance');


exports.getAllAttendance = async (req, res) => {
    try {
        await getAllAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getAttendanceByID = async (req, res) => {
    try {
        await getAttendanceByID(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.addAttendance = async (req, res) => {
    try {
        await AddAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.updateAttendance = async (req, res) =>{
    try {
        await updateAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.deleteAttendance = async (req, res) => {
    try {
        await deleteAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
exports.getOwnAttendance = async (req, res) => {
    try {
        await getOwnAttendance(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}