const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth } = require('../middleware/auth');

router.get('/deposit', auth, settingsController.getDepositSettings);

module.exports = router;
