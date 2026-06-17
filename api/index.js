const connectDB = require('../backend/config/db');
const app = require('../backend/server');

module.exports = async (req, res) => {
  res.setHeader('Connection', 'close');
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
    });
  }
};
