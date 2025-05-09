const express = require('express');
const {requireAuth} = require('../../middlewares/auth');
const { getAllDepart, EditDepart, deleteDepart, createDepart }  = require('../../controllers/api/department')
const router = express.Router();

//Get
router.get('/getAll_Dept',requireAuth,getAllDepart  );

//Create
router.post('/create_Dept',requireAuth, createDepart);

//Edit
router.put('/edit_Dept/:id',requireAuth,   EditDepart);

//Delete
router.delete('/delete_Dept/:id',requireAuth,  deleteDepart);

module.exports = router;