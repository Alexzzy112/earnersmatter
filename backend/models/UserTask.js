const mongoose = require('mongoose');

const userTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  reward: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  forDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

userTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });
userTaskSchema.index({ userId: 1, forDate: 1 });

module.exports = mongoose.model('UserTask', userTaskSchema);
