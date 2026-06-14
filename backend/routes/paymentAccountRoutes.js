const express = require('express');
const router = express.Router();
const paymentAccountController = require('../controllers/paymentAccountController');

router.get('/active', paymentAccountController.getActiveAccount);

module.exports = router;
