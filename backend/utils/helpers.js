const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateReference = () => {
  return `TXN-${uuidv4().split('-')[0]}-${Date.now()}`;
};

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const calculateWithdrawalCharge = (amount) => {
  return amount * 0.05;
};

const formatCurrency = (amount) => {
  return Number(amount).toFixed(2);
};

const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

module.exports = {
  generateReference,
  generateReferralCode,
  generateToken,
  calculateWithdrawalCharge,
  formatCurrency,
  paginate,
};
