const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  linkUrl: {
    type: String,
  },
  reward: {
    type: Number,
    required: true,
    default: 0,
  },
  type: {
    type: String,
    enum: ['ad', 'click', 'watch'],
    default: 'ad',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  forDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

taskSchema.index({ forDate: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
