const mongoose = require('mongoose');

const accountSwitchLogSchema = new mongoose.Schema({
  previousAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAccount',
  },
  newAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAccount',
    required: true,
  },
  switchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  switchType: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual',
  },
  switchedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AccountSwitchLog', accountSwitchLogSchema);
