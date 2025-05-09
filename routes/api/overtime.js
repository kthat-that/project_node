const express = require('express');
const {requestOTPost, getOT, getOTbyID, updateOT, deleteOT, getOTbyUser} = require('../../controllers/api/overtime');
const {requireAuth} = require('../../middlewares/auth');

const router = express.Router();

router.post('/ot/request',requireAuth, requestOTPost);
router.get('/ot/receive',requireAuth, getOT);
router.get('/ot/receive/:id',requireAuth, getOTbyID);
router.put('/ot/update/:id',requireAuth, updateOT);
router.delete('/ot/delete/:id',requireAuth, deleteOT);
router.post('/ot/update/:id',requireAuth, );
router.get('/ot/employee/receive',requireAuth, getOTbyUser);

module.exports = router;