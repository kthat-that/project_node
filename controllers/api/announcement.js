
const { createAnnouncement, getAll, deleteAnnount, updateAnnouncement } = require("../../resources/announcement");

exports.createAnnount = async (req, res) => {
    try {
        await createAnnouncement(req, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.getAnnount = async (req, res) => {
    try {
        let data = await getAll(req.query.page, req.query.perpage);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.deleteAnnount = async (req, res) => {
    try {
        await deleteAnnount(req, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.updateAnnouncement = async (req, res) => {
    try {
        await updateAnnouncement(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}