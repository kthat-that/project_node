const express = require('express');
const addAdmin = require('../../controllers/web/add-admin');
const { requireAuth, authorize } = require('../../middlewares/auth');
const router = express.Router();

// router.get('/add-admin',requireAuth,addAdmin.getAdmin );
router.get('/add-admin',requireAuth,authorize([3]),addAdmin.getAdmin );

module.exports = router;