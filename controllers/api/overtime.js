const {RequestOT, getAllOT, getOTByEmployeeID, editOTRequest, deleteOTRecord, getOTbyUser} = require('../../resources/overtime')

exports.requestOTPost = async (req, res) => {
    try {
        await RequestOT(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.getOT = async (req, res) => {
    try{
        await getAllOT(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.getOTbyID = async (req, res) => {
    try{
        await getOTByEmployeeID(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.updateOT = async (req, res) => {
    try{
        await editOTRequest(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.deleteOT = async (req, res) => {
    try{
        await deleteOTRecord(req, res);
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.getOTbyUser = async (req, res) => {
    try{
        await getOTbyUser(req, res);
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
