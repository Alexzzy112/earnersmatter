const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');

router.get('/today', auth, taskController.getTodayTasks);
router.post('/complete', auth, taskController.completeTask);
router.get('/history', auth, taskController.getTaskHistory);

module.exports = router;
