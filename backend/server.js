const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// XSS sanitization middleware
const sanitizeValue = (value) => {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', routes);

// Seed endpoint (temporary - hit once to populate DB)
app.post('/api/seed', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Setting = require('./models/Setting');
    const User = require('./models/User');
    const Product = require('./models/Product');
    const PaymentAccount = require('./models/PaymentAccount');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      await mongoose.connection.db.dropCollection(c.name);
    }

    await Setting.insertMany([
      { key: 'siteName', value: 'EarnersMatter' },
      { key: 'siteDescription', value: 'Modern Investment Platform' },
      { key: 'minDeposit', value: 10 },
      { key: 'maxDeposit', value: 100000 },
      { key: 'minWithdrawal', value: 2500 },
      { key: 'maxWithdrawal', value: 50000 },
      { key: 'withdrawalCharge', value: 5 },
      { key: 'referralBonus', value: 1000 },
      { key: 'bonusType', value: 'fixed' },
      { key: 'currencySymbol', value: '₦' },
      { key: 'maintenanceMode', value: false },
    ]);

    await User.create({ username: 'Alexzzy Admin', email: 'admin@earnersmatter.com', password: 'Admin@12345', role: 'admin', status: 'active', emailVerifiedAt: new Date() });
    await User.create({ username: 'john', email: 'john@example.com', password: 'User@12345', role: 'user', status: 'active', referralCode: require('./utils/helpers').generateReferralCode(), emailVerifiedAt: new Date() });

    await Product.insertMany([
      { name: 'iPhone 7', price: 3000, dailyEarnings: 540, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+7' },
      { name: 'iPhone 8', price: 7000, dailyEarnings: 1260, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+8' },
      { name: 'iPhone X', price: 15000, dailyEarnings: 2700, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+X' },
      { name: 'iPhone XR', price: 25000, dailyEarnings: 4500, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+XR' },
      { name: 'iPhone 11', price: 30000, dailyEarnings: 5400, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+11' },
      { name: 'iPhone 12', price: 50000, dailyEarnings: 9000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+12' },
      { name: 'iPhone 13', price: 70000, dailyEarnings: 12600, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+13' },
      { name: 'iPhone 14', price: 100000, dailyEarnings: 18000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+14' },
      { name: 'iPhone 15', price: 300000, dailyEarnings: 54000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+15' },
      { name: 'iPhone 16', price: 500000, dailyEarnings: 90000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+16' },
      { name: 'iPhone 17', price: 700000, dailyEarnings: 126000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+17' },
      { name: 'iPhone 18', price: 1000000, dailyEarnings: 180000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+18' },
      { name: 'iPhone 19', price: 2000000, dailyEarnings: 360000, duration: 30, status: 'active', image: 'https://placehold.co/400x400?text=iPhone+19' },
    ]);

    await PaymentAccount.insertMany([
      { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'EarnersMatter Ltd', isActive: true },
      { bankName: 'Access Bank', accountNumber: '9876543210', accountName: 'EarnersMatter Ltd', isActive: false },
      { bankName: 'Zenith Bank', accountNumber: '5555555555', accountName: 'EarnersMatter Ltd', isActive: false },
    ]);

    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server only when run directly (not on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  });
}

module.exports = app;
