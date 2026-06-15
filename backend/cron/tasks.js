const cron = require('node-cron');
const Task = require('../models/Task');

const adTemplates = [
  { title: 'Sponsored: Earn More Today', description: 'Check out this exclusive investment opportunity and grow your portfolio faster.', type: 'ad' },
  { title: 'Watch & Earn: Platform Tutorial', description: 'Watch our quick tutorial on maximizing your daily earnings.', type: 'watch' },
  { title: 'Click & Earn: Market Update', description: 'Click to view today\'s market update and stay informed about your investments.', type: 'click' },
  { title: 'Sponsored: Daily Tips', description: 'Read our daily investment tips to make smarter decisions.', type: 'click' },
];

const generateDailyTasks = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Task.countDocuments({ forDate: { $gte: today, $lt: tomorrow } });
    if (existing > 0) {
      return { generated: 0, message: 'Tasks already exist for today' };
    }

    const tasks = adTemplates.map((tpl, i) => ({
      title: tpl.title,
      description: tpl.description,
      imageUrl: `https://placehold.co/600x200/1a1a2e/e94560?text=Ad+${i + 1}`,
      linkUrl: '#',
      reward: 500,
      type: tpl.type,
      status: 'active',
      forDate: today,
    }));

    await Task.insertMany(tasks);
    return { generated: tasks.length, message: `${tasks.length} daily tasks generated` };
  } catch (error) {
    console.error('Error generating daily tasks:', error.message);
    return { generated: 0, message: error.message };
  }
};

cron.schedule('0 0 * * *', () => {
  console.log('Generating daily tasks...');
  generateDailyTasks()
    .then((res) => console.log(res.message))
    .catch((err) => console.error('Task generation cron failed:', err.message));
});

module.exports = { generateDailyTasks };
