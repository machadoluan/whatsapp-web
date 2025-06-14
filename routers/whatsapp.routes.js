const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');

router.get('/qr-code', whatsappController.getQrCode);
router.post('/send-message', whatsappController.sendMessage);

module.exports = router;