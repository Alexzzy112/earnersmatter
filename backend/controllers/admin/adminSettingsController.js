const Setting = require('../../models/Setting');
const { logAction } = require('../../utils/auditLogger');

exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsMap = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    await logAction({
      userId: req.user._id,
      action: 'setting_updated',
      entityType: 'Setting',
      entityId: setting._id,
      details: { key, value },
      req,
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
