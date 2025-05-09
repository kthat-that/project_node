const { Scan } = require("../../resources/scan");

exports.scanAttendance = async (req, res) => {
    try {
        await Scan(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
