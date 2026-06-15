const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const Notification = require('../models/Notification');
const helpers = require('../utils/helpers');

const getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hasInvestment = await Investment.findOne({ userId: req.user._id, status: 'active' });

    const tasks = await Task.find({
      forDate: { $gte: today, $lt: tomorrow },
      status: 'active',
    }).sort({ createdAt: 1 });

    const completedIds = await UserTask.find({
      userId: req.user._id,
      forDate: { $gte: today, $lt: tomorrow },
    }).distinct('taskId');

    const completedSet = new Set(completedIds.map((id) => id.toString()));

    const data = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      imageUrl: task.imageUrl,
      linkUrl: task.linkUrl,
      reward: task.reward,
      type: task.type,
      completed: completedSet.has(task._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data,
      meta: {
        total: tasks.length,
        completed: completedIds.length,
        canEarn: hasInvestment ? tasks.length * 500 : 0,
        locked: !hasInvestment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID is required' });
    }

    const hasInvestment = await Investment.findOne({ userId: req.user._id, status: 'active' });
    if (!hasInvestment) {
      return res.status(400).json({ success: false, message: 'You need an active investment to earn from tasks' });
    }

    const task = await Task.findOne({ _id: taskId, status: 'active' });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const existing = await UserTask.findOne({ userId: req.user._id, taskId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Task already completed' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await User.findById(req.user._id);
    const balanceBefore = user.walletBalance;

    user.walletBalance += task.reward;
    user.totalEarnings += task.reward;
    await user.save();

    await UserTask.create({
      userId: req.user._id,
      taskId: task._id,
      reward: task.reward,
      completedAt: new Date(),
      forDate: today,
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'earning',
      amount: task.reward,
      balanceBefore,
      balanceAfter: user.walletBalance,
      description: `Task reward: ${task.title}`,
      reference: helpers.generateReference(),
      status: 'completed',
    });

    await Notification.create({
      userId: req.user._id,
      type: 'earning_credited',
      title: 'Task Reward Credited',
      message: `You earned ₦${task.reward.toLocaleString()} for completing: ${task.title}`,
    });

    res.status(200).json({
      success: true,
      message: 'Task completed! Reward credited to your wallet.',
      data: { reward: task.reward, balance: user.walletBalance },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const history = await UserTask.find({ userId: req.user._id })
      .populate('taskId', 'title reward')
      .sort({ completedAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayTasks,
  completeTask,
  getTaskHistory,
};
