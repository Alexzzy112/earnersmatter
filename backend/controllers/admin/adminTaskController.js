const Task = require('../../models/Task');
const { generateDailyTasks } = require('../../cron/tasks');
const { logAction } = require('../../utils/auditLogger');

exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find().sort({ forDate: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      Task.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, reward, type } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const task = await Task.create({
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      linkUrl: linkUrl || '#',
      reward: reward || 500,
      type: type || 'ad',
      status: 'active',
      forDate: today,
    });

    await logAction({
      userId: req.user._id,
      action: 'task_created',
      entityType: 'Task',
      entityId: task._id,
      details: { title },
      req,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowed = ['title', 'description', 'imageUrl', 'linkUrl', 'reward', 'type', 'status'];
    const data = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'task_updated',
      entityType: 'Task',
      entityId: task._id,
      details: req.body,
      req,
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'task_deleted',
      entityType: 'Task',
      entityId: task._id,
      details: { title: task.title },
      req,
    });

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateTasks = async (req, res) => {
  try {
    const result = await generateDailyTasks();

    await logAction({
      userId: req.user._id,
      action: 'tasks_generated',
      entityType: 'Task',
      details: result,
      req,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
