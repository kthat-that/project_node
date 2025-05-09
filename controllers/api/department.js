const { getAllDepartment, postCreateDepartment, postEditDepartment, deleteDepartment } = require("../../resources/department");


exports.getAllDepart = async (req, res) => {
    try {
        await getAllDepartment(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.createDepart = async (req, res) => {
    try {
        await postCreateDepartment(req, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.EditDepart = async (req, res) => {
    try {
        await postEditDepartment(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.deleteDepart = async (req, res) => {
    try {
        await deleteDepartment(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

