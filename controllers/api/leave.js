const {requestLeave, getLeaves, getLeaveById, editLeave, deleteLeave, getOwnLeave} = require('../../resources/leave');

exports.postLeave = async (req, res) =>{
    try{
        await requestLeave(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}
exports.getAllLeaves = async (req, res) => {
    try{
        await getLeaves(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}
exports.getAllLeaveById = async (req, res) => {
    try{
        await getLeaveById(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}
exports.editLeave = async (req, res) => {
    try{
        await editLeave(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}
exports.deleteLeave = async (req, res) => {
    try{
        await deleteLeave(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}
exports.getOwnLeave = async (req, res) => {
    try{
        await getOwnLeave(req, res);
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}