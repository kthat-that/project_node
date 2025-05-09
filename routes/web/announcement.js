const express = require('express');
const {requireAuth,authorize} = require('../../middlewares/auth');
const { getAllAnnouncement } = require('../../controllers/web/announcement');

const router = express.Router();

router.get('/announcement',requireAuth,authorize([2,3]), getAllAnnouncement);

module.exports = router;