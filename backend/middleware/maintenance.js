const Setting = require('../models/Setting');

const maintenanceMode = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'maintenanceMode' });
    const isMaintenance = setting?.value === true || setting?.value === 'true';

    if (!isMaintenance) {
      return next();
    }

    if (req.user && req.user.role === 'admin') {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'System is currently under maintenance. Please try again later.',
    });
  } catch (error) {
    next();
  }
};

module.exports = { maintenanceMode };
