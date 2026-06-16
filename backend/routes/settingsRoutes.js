const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth } = require('../middleware/auth');

router.get('/deposit', auth, settingsController.getDepositSettings);
router.get('/contact', settingsController.getContactSettings);
router.get('/withdrawal', auth, settingsController.getWithdrawalSettings);

module.exports = router;
