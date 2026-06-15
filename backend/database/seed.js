const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Setting = require('../models/Setting');
const User = require('../models/User');
const Product = require('../models/Product');
const PaymentAccount = require('../models/PaymentAccount');
const { generateReferralCode } = require('../utils/helpers');

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`Dropped collection: ${collection.name}`);
    }

    const settings = [
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
      { key: 'contactTelegramChannel', value: 'https://t.me/earnersmatter' },
      { key: 'contactTelegramAdmin', value: 'https://t.me/earnersmatter_admin' },
    ];
    await Setting.insertMany(settings);
    console.log('Settings created successfully.');

    await User.create({
      username: 'Alexzzy Admin',
      email: 'admin@earnersmatter.com',
      password: 'Admin@12345',
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
    });
    console.log('Admin user created successfully.');

    await User.create({
      username: 'john',
      email: 'john@example.com',
      password: 'User@12345',
      role: 'user',
      status: 'active',
      referralCode: generateReferralCode(),
      emailVerifiedAt: new Date(),
    });
    console.log('Test user created successfully.');

    const products = [
      { name: 'iPhone 7', price: 3000, dailyEarnings: 540, duration: 30, description: 'iPhone 7 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+7' },
      { name: 'iPhone 8', price: 7000, dailyEarnings: 1260, duration: 30, description: 'iPhone 8 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+8' },
      { name: 'iPhone X', price: 15000, dailyEarnings: 2700, duration: 30, description: 'iPhone X investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+X' },
      { name: 'iPhone XR', price: 25000, dailyEarnings: 4500, duration: 30, description: 'iPhone XR investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+XR' },
      { name: 'iPhone 11', price: 30000, dailyEarnings: 5400, duration: 30, description: 'iPhone 11 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+11' },
      { name: 'iPhone 12', price: 50000, dailyEarnings: 9000, duration: 30, description: 'iPhone 12 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+12' },
      { name: 'iPhone 13', price: 70000, dailyEarnings: 12600, duration: 30, description: 'iPhone 13 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+13' },
      { name: 'iPhone 14', price: 100000, dailyEarnings: 18000, duration: 30, description: 'iPhone 14 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+14' },
      { name: 'iPhone 15', price: 300000, dailyEarnings: 54000, duration: 30, description: 'iPhone 15 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+15' },
      { name: 'iPhone 16', price: 500000, dailyEarnings: 90000, duration: 30, description: 'iPhone 16 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+16' },
      { name: 'iPhone 17', price: 700000, dailyEarnings: 126000, duration: 30, description: 'iPhone 17 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+17' },
      { name: 'iPhone 18', price: 1000000, dailyEarnings: 180000, duration: 30, description: 'iPhone 18 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+18' },
      { name: 'iPhone 19', price: 2000000, dailyEarnings: 360000, duration: 30, description: 'iPhone 19 investment slot — earn 18% daily', status: 'active', image: 'https://placehold.co/400x400/1a1a2e/e94560?text=iPhone+19' },
    ];
    await Product.insertMany(products);
    console.log('Products created successfully.');

    const paymentAccounts = [
      { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'EarnersMatter Ltd', isActive: true },
      { bankName: 'Access Bank', accountNumber: '9876543210', accountName: 'EarnersMatter Ltd', isActive: false },
      { bankName: 'Zenith Bank', accountNumber: '5555555555', accountName: 'EarnersMatter Ltd', isActive: false },
    ];
    await PaymentAccount.insertMany(paymentAccounts);
    console.log('Payment accounts created successfully.');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
