const Task = require('../../models/Task');
const { generateDailyTasks } = require('../../cron/tasks');

exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find().sort({ forDate: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Task.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
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

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
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
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateTasks = async (req, res) => {
  try {
    const result = await generateDailyTasks();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
