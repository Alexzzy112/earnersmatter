const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

router.get('/top-investors', leaderboardController.getTopInvestors);
router.get('/weekly-growing', leaderboardController.getWeeklyGrowing);

module.exports = router;