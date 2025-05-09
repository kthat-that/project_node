const express = require('express');
const {registerPost,loginPost,logout,getUser, updatePassword, updateEmp, getAllEmp, deleteEmployee, updateAvarta, resetPass,getAllEmpPg, getme} = require('../../controllers/api/auth')
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();



router.post('/api/auth/register',requireAuth,registerPost);
router.post('/api/auth/login', loginPost);
router.delete('/api/auth/logout',requireAuth, logout);
router.put('/api/emp/edit-password/:id',requireAuth, updatePassword);
router.put('/api/emp/reset-password/:id',requireAuth, resetPass);


router.put('/api/emp/edit-emp/:id',requireAuth, updateEmp);
router.get('/api/emp/getme',requireAuth, getme);
router.delete('/api/emp/delete/:id',requireAuth, deleteEmployee);
router.put('/api/emp/avatar',requireAuth, updateAvarta);
router.get('/api/list-pagi',requireAuth,getAllEmpPg);


router.get('/api/getUser',requireAuth, getUser);
module.exports = router;

