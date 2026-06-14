const express = require('express');
const router = express.Router();
const earningController = require('../controllers/earningController');
const { auth } = require('../middleware/auth');

router.get('/', auth, earningController.getUserEarnings);
router.get('/schedule/:investmentId', auth, earningController.getEarningSchedule);

module.exports = router;
