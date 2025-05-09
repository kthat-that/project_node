const {getAllAttendance, getAttendanceByID, addAttendance, updateAttendance, deleteAttendance, getOwnAttendance} = require('../../controllers/api/attendance');
const {requireAuth} = require('../../middlewares/auth')
const express = require('express');
const router = express.Router();

router.get('/api/attendance',requireAuth ,getAllAttendance);
router.get('/api/attendance/:id',requireAuth ,getAttendanceByID);
router.get('/api/employee/attendance',requireAuth ,getOwnAttendance);
router.post('/api/add_attendance',requireAuth, addAttendance);
router.put('/api/add_attendance',requireAuth, updateAttendance);
router.delete('/api/attendance/:id',requireAuth, deleteAttendance);

module.exports = router;