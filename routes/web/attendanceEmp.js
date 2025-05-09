const express = require('express');
const attendanceController = require('../../controllers/web/attendanceEmp');
const {requireAuth,authorize} = require('../../middlewares/auth');

const router = express.Router();

router.get('/attendanceEmp' ,requireAuth,authorize([2,3]),attendanceController.getAttendance );

module.exports = router;