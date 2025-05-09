const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const { createPosition, getAllPosition, EditPosition, deletePosition } = require('../../controllers/api/position');


const router = express.Router();

//Get
router.get('/getAll_Postion',requireAuth, getAllPosition);

//Create
router.post('/create_Position',requireAuth,createPosition);

//Edit
router.put('/edit_Position/:id',requireAuth,  EditPosition);

//Delete
router.delete('/delete_Position/:id',requireAuth, deletePosition);

module.exports = router;