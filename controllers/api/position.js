const { getAllPosition, postCreatePosition, postEditPosition, deletePosition } = require("../../resources/position");


exports.getAllPosition = async (req, res) => {
    try {
        await getAllPosition(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.createPosition = async (req, res) => {
    try {
        await postCreatePosition(req, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.EditPosition = async (req, res) => {
    try {
        await postEditPosition(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.deletePosition = async (req, res) => {
    try {
        await deletePosition(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

