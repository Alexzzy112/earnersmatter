const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');

router.get('/today', auth, taskController.getTodayTasks);
router.post('/start', auth, taskController.startTask);
router.post('/receive-reward', auth, taskController.receiveReward);
router.get('/history', auth, taskController.getTaskHistory);

module.exports = router;
