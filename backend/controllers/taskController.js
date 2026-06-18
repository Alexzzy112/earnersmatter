const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const EarningSchedule = require('../models/EarningSchedule');
const Notification = require('../models/Notification');
const helpers = require('../utils/helpers');
const { generateDailyTasks } = require('../cron/tasks');

const TASKS_PER_DAY = 5;

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
    const totalDailyEarnings = hasInvestment
      ? (await Investment.find({ userId: req.user._id, status: 'active' }))
          .reduce((sum, inv) => sum + (inv.dailyEarnings || 0), 0)
      : 0;

    let tasks = await Task.find({
      forDate: { $gte: today, $lt: tomorrow },
      status: 'active',
    }).sort({ createdAt: 1 });

    if (tasks.length === 0) {
      await generateDailyTasks();
      tasks = await Task.find({
        forDate: { $gte: today, $lt: tomorrow },
        status: 'active',
      }).sort({ createdAt: 1 });
    }

    const userTasks = await UserTask.find({
      userId: req.user._id,
      forDate: { $gte: today, $lt: tomorrow },
    });

    const userTaskMap = {};
    for (const ut of userTasks) {
      userTaskMap[ut.taskId.toString()] = ut;
    }

    const reward = hasInvestment ? Math.round(totalDailyEarnings / TASKS_PER_DAY) : 0;

    const data = tasks.map((task) => {
      const ut = userTaskMap[task._id.toString()];
      let taskStatus = 'not_started';
      let startedAt = null;
      if (ut) {
        taskStatus = ut.status;
        startedAt = ut.startedAt;
      }
      return {
        _id: task._id,
        title: task.title,
        description: task.description,
        imageUrl: task.imageUrl,
        linkUrl: task.linkUrl,
        reward,
        type: task.type,
        status: taskStatus,
        startedAt,
      };
    });

    const completedCount = userTasks.filter((ut) => ut.status === 'completed').length;
    const startedCount = userTasks.filter((ut) => ut.status === 'started').length;

    res.status(200).json({
      success: true,
      data,
      meta: {
        total: tasks.length,
        completed: completedCount,
        started: startedCount,
        perTaskReward: reward,
        totalDailyEarnings,
        canEarn: reward * TASKS_PER_DAY,
        locked: !hasInvestment,
        allCompleted: completedCount >= TASKS_PER_DAY,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startTask = async (req, res) => {
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
    if (existing && existing.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Task already completed' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existing && existing.status === 'started') {
      return res.status(200).json({
        success: true,
        message: 'Task already started',
        data: { linkUrl: task.linkUrl, _id: task._id },
      });
    }

    await UserTask.findOneAndUpdate(
      { userId: req.user._id, taskId },
      {
        userId: req.user._id,
        taskId: task._id,
        reward: 0,
        status: 'started',
        startedAt: new Date(),
        forDate: today,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Task started',
      data: { linkUrl: task.linkUrl, _id: task._id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const receiveReward = async (req, res) => {
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

    const userTask = await UserTask.findOne({ userId: req.user._id, taskId });
    if (!userTask || userTask.status !== 'started') {
      return res.status(400).json({ success: false, message: 'You must start the task first before claiming reward' });
    }

    if (userTask.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Reward already claimed for this task' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reward = await getPerTaskReward(req.user._id);

    const user = await User.findById(req.user._id);
    const balanceBefore = user.walletBalance;

    user.walletBalance += reward;
    user.totalEarnings += reward;
    await user.save();

    userTask.status = 'completed';
    userTask.reward = reward;
    userTask.completedAt = new Date();
    await userTask.save();

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

    const completedCount = await UserTask.countDocuments({
      userId: req.user._id,
      forDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      message: 'Reward credited to your wallet!',
      data: {
        reward,
        balance: user.walletBalance,
        completedCount,
        allCompleted: completedCount >= TASKS_PER_DAY,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const history = await UserTask.find({ userId: req.user._id })
      .populate('taskId', 'title')
      .sort({ completedAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayTasks,
  startTask,
  receiveReward,
  getTaskHistory,
};
