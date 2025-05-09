const express = require('express');
const {generatePayroll,getPayrolls,getPayrollByID, deletePayroll, updatePayroll, getPayrollByUser} = require('../../controllers/api/payroll');
const {requireAuth} = require('../../middlewares/auth')
const router = express.Router();

router.post('/payroll/generate',requireAuth, generatePayroll );
router.get('/payroll/receive',requireAuth, getPayrolls);
router.get('/payroll/receive/:id',requireAuth, getPayrollByID);
router.get('/payroll/employee/receive', requireAuth, getPayrollByUser);
router.delete('/payroll/delete-receive/:id',requireAuth, deletePayroll);
router.put('/payroll/edit-receive/:id',requireAuth,updatePayroll);

module.exports = router;