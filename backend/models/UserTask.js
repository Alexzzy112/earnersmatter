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
  status: {
    type: String,
    enum: ['pending', 'started', 'completed'],
    default: 'pending',
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  forDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

userTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });
userTaskSchema.index({ userId: 1, forDate: 1, status: 1 });

module.exports = mongoose.model('UserTask', userTaskSchema);
