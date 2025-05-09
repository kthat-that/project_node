const express = require('express');
const {postLeave, getAllLeaves,getAllLeaveById, editLeave, deleteLeave, getOwnLeave} = require('../../controllers/api/leave')
const {requireAuth} = require('../../middlewares/auth')
const router = express.Router();

router.post('/api/leave/:id',requireAuth ,postLeave);
router.get('/api/leave',requireAuth, getAllLeaves);
router.get('/api/employee/leave', requireAuth, getOwnLeave)
router.get('/api/leave/:id',requireAuth, getAllLeaveById);
router.put('/api/edit/leave/:id',requireAuth,editLeave);
router.delete('/api/delete/leave/:id',requireAuth, deleteLeave)

module.exports = router;