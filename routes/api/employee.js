const express = require('express');
const { getEmployeeData,getEmployeeById, postfrmCreate, deleteEmp, postEdit } = require('../../controllers/api/employee.js');
const { requireAuth } = require('../../middlewares/auth.js');

const router = express.Router();

//Get all data
router.get('/employee',requireAuth, getEmployeeData);
router.get('/employee/:id',getEmployeeById)

//post create
// router.get('/createEmp',requireAuth, postfrmCreate);
router.post('/createEmp', postfrmCreate);

//delete
router.delete('/delete/:id', deleteEmp);

//edit
// router.get('/editEmp/:id', getEdit)
router.put('/editEmp',postEdit)


module.exports = router;