const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const Notification = require('../models/Notification');
const helpers = require('../utils/helpers');

const TASKS_PER_DAY = 4;

const getPerTaskReward = async (userId) => {
  const investments = await Investment.find({ userId, status: 'active' });
  const totalDailyEarnings = investments.reduce((sum, inv) => sum + (inv.dailyEarnings || 0), 0);
  return Math.round(totalDailyEarnings / TASKS_PER_DAY);
};

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

    const reward = hasInvestment ? await getPerTaskReward(req.user._id) : 0;

    const data = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      imageUrl: task.imageUrl,
      linkUrl: task.linkUrl,
      reward,
      type: task.type,
      completed: completedSet.has(task._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data,
      meta: {
        total: tasks.length,
        completed: completedIds.length,
        canEarn: hasInvestment ? TASKS_PER_DAY * reward : 0,
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

    const reward = await getPerTaskReward(req.user._id);

    const user = await User.findById(req.user._id);
    const balanceBefore = user.walletBalance;

    user.walletBalance += reward;
    user.totalEarnings += reward;
    await user.save();

    try {
      await UserTask.create({
        userId: req.user._id,
        taskId: task._id,
        reward,
        completedAt: new Date(),
        forDate: today,
      });
    } catch (createError) {
      if (createError.code === 11000) {
        return res.status(400).json({ success: false, message: 'Task already completed' });
      }
      throw createError;
    }

    await Transaction.create({
      userId: req.user._id,
      type: 'earning',
      amount: reward,
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
      message: `You earned ₦${reward.toLocaleString()} for completing: ${task.title}`,
    });

    res.status(200).json({
      success: true,
      message: 'Task completed! Reward credited to your wallet.',
      data: { reward, balance: user.walletBalance },
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
