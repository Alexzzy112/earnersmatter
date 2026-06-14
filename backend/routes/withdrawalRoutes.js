const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth } = require('../middleware/auth');

router.post('/', auth, withdrawalController.createWithdrawal);
router.get('/', auth, withdrawalController.getUserWithdrawals);

module.exports = router;
