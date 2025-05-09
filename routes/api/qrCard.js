const express = require('express');
const { qrCard, qrCardAlls } = require('../../controllers/api/card');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const path = require('path');
const fs = require('fs');
//POST
router.post('/api/qr/card/:id',upload.none(),qrCard);
router.post('/api/qr/cardAll',upload.none(),qrCardAlls);
router.get('/pdf/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../storage/documents/cv', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found: ${filePath}`, err);
            return res.redirect('/404'); 
        }

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`Error serving file: ${filePath}`, err);
                if (!res.headersSent) {
                    return res.redirect('/404');
                }
            }
        });
    });
});

module.exports = router;