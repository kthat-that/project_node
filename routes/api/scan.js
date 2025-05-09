const express = require('express');
const {scanAttendance} = require('../../controllers/api/scan');
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();
router.post('/api/attendance/checkin',requireAuth,scanAttendance);

module.exports = router;
