const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { auth } = require('../middleware/auth');

router.get('/', auth, referralController.getReferrals);
router.get('/stats', auth, referralController.getReferralStats);

module.exports = router;
