const express = require('express');
const con = require('../../config/db')
const auth = require('../../controllers/web/auth')
const {requireAuth} = require('../../middlewares/auth');

const router = express.Router();

router.get('/page-login', auth.getLogin);
router.get('/page-Register',requireAuth, auth.getRegister);
router.get('/page-change-pass',requireAuth, auth.getChangePass);


router.get('/page-forgot-password', auth.getForgotPass);
router.get('/page-lock-screen', auth.getLockScreen);

module.exports = router;