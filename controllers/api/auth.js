const { createUser, getUser, login, updatepass, updateEmployee, getEmployee, deleteEmp, updateAvarta, resetPass, sortPagi } = require("../../resources/user");


exports.registerPost = async (req, res) => {
    try {
        await createUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.getAllEmpPg = async(req,res)=>{
    try {
        const datas =  await sortPagi(req.query.search,req.query.page,req.query.perpage);
        res.json(datas)
        // res.render('pages/employee/list-employee',{data:datas});
      
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


exports.getUser = async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.loginPost = async (req, res) => {
    try {
        await login(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        await updatepass(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.resetPass = async (req, res) => {
    try {
        await resetPass(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.logout = (req, res) => {
    res.cookie('jwtToken', '', { maxAge: 1, httpOnly: true });
    res.status(200).json({
        result:true,
        message: "Logout successfully!"
    });
}

exports.updateEmp = async (req, res) => {
    try {
        await updateEmployee(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.getme = async(req,res)=>{
    try {
        await getEmployee(req,res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
exports.deleteEmployee = async(req,res)=>{
    try {
        await deleteEmp(req,res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    } 
}
exports.updateAvarta = async(req,res)=>{
    try {
        await updateAvarta(req,res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }  
}