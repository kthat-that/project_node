const express = require('express');
const {requireAuth} = require('../../middlewares/auth');
const { createAnnount, getAnnount, deleteAnnount, updateAnnouncement } = require('../../controllers/api/announcement');

const router = express.Router();


router.post('/api/create_annount',requireAuth, createAnnount);
router.get('/api/getAll_annount',requireAuth, getAnnount);
router.delete('/api/delete_annount/:id',requireAuth, deleteAnnount);
router.put('/api/update_annount/:id',requireAuth, updateAnnouncement);

module.exports = router;