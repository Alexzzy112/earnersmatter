const Notification = require('../../models/Notification');
const User = require('../../models/User');

const sendNotification = async (req, res) => {
  try {
    const { userIds, allUsers, title, message, type } = req.body;

    if ((!userIds || userIds.length === 0) && !allUsers) {
      return res.status(400).json({ success: false, message: 'Provide userIds or set allUsers to true' });
    }

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let targetUsers = [];
    if (allUsers) {
      const users = await User.find({ role: 'user' }).select('_id');
      targetUsers = users.map(u => u._id);
    } else {
      targetUsers = userIds;
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ success: false, message: 'No target users found' });
    }

    const notifications = targetUsers.map(userId => ({
      userId,
      type: type || 'admin',
      title,
      message,
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${targetUsers.length} user(s)`,
      data: { recipients: targetUsers.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsersForNotification = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('username email status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendNotification,
  getUsersForNotification,
};
