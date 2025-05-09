const express = require('express');
const {requireAuth} = require('../../middlewares/auth');
const {getDashboardStats, getPerformanceStats, getPerformanceStatByID,getOwnPerformance,countCurrentAttendance, payrollStatistics, overtimeStatistics, getMepayroll, getTotalLeave, getLeaveFilter, getTotalOT, getTotalOTMonthly} = require('../../controllers/api/statistic');
const router = express.Router();

router.get('/api/stastic/dashboard',requireAuth , getDashboardStats);
router.get('/api/stastic/performance',requireAuth , getPerformanceStats);
router.get('/api/stastic/performance/:id',requireAuth , getPerformanceStatByID);
router.get('/api/stastic/ownperformance',requireAuth , getOwnPerformance);
router.get('/api/stastic/attendance',requireAuth , countCurrentAttendance);
router.get('/api/stastic/payrolls',requireAuth , payrollStatistics);
router.get('/api/stastic/overtime',requireAuth , overtimeStatistics);
router.get('/api/stastic/getMe',requireAuth , getMepayroll);
router.get('/api/stastic/getMeLeave',requireAuth , getTotalLeave);
router.get('/api/stastic/getLeavefilter',requireAuth , getLeaveFilter);
router.get('/api/stastic/getTotalOt',requireAuth , getTotalOT);
router.get('/api/stastic/getTotalOtmonth',requireAuth , getTotalOTMonthly);


module.exports = router;