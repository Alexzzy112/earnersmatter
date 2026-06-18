const cron = require('node-cron');
const Task = require('../models/Task');
const Setting = require('../models/Setting');

const defaultTemplates = [
  { title: 'Daily Task', description: 'Complete this quick task to earn your daily reward and keep your investment growing!', type: 'ad' },
  { title: 'Daily Task', description: 'Stay consistent and watch your portfolio grow — one task at a time!', type: 'ad' },
  { title: 'Daily Task', description: 'Your daily earnings are waiting. Complete this task to claim them now!', type: 'ad' },
  { title: 'Daily Task', description: 'Every task brings you closer to your financial goals. Keep going!', type: 'ad' },
  { title: 'Daily Task', description: 'Success is built on small daily habits. Complete this task and level up!', type: 'ad' },
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

    const [dailyTasksSetting, adLinkSetting, adImageSetting] = await Promise.all([
      Setting.findOne({ key: 'dailyTasks' }),
      Setting.findOne({ key: 'defaultAdLink' }),
      Setting.findOne({ key: 'defaultAdImage' }),
    ]);
    const defaultAdLink = adLinkSetting?.value || '';
    const defaultAdImage = adImageSetting?.value || '';

    if (!defaultAdLink) {
      console.warn('⚠️  defaultAdLink setting is empty — tasks will have no link URL. Set it in Admin → Settings → Tasks.');
    }

    let templates = defaultTemplates;
    if (dailyTasksSetting && Array.isArray(dailyTasksSetting.value) && dailyTasksSetting.value.length > 0) {
      templates = dailyTasksSetting.value;
    }

    const tasks = templates.map((tpl, i) => ({
      title: tpl.title,
      description: tpl.description,
      imageUrl: tpl.imageUrl || defaultAdImage || `https://placehold.co/600x200/1a1a2e/e94560?text=Ad+${i + 1}`,
      linkUrl: tpl.linkUrl || defaultAdLink,
      reward: tpl.reward || 500,
      type: tpl.type || 'ad',
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

const resetDailyTasks = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Task.deleteMany({ forDate: { $gte: today, $lt: tomorrow } });
    const result = await generateDailyTasks();
    return { ...result, message: `Tasks reset — ${result.message}` };
  } catch (error) {
    console.error('Error resetting daily tasks:', error.message);
    return { generated: 0, message: error.message };
  }
};

module.exports = { generateDailyTasks, resetDailyTasks };
