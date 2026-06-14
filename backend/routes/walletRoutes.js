const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { auth } = require('../middleware/auth');

router.get('/', auth, walletController.getWallet);
router.get('/transactions', auth, walletController.getTransactions);

module.exports = router;
