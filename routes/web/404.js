const express = require('express');
const {requireAuth} = require('../../middlewares/auth');
const { get404 } = require('../../controllers/web/404');

const router = express.Router();

router.get('/404',requireAuth, get404);
router.use((req, res, next) => {
    res.redirect('/404'); 
});
module.exports = router;