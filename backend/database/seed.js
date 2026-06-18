const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Setting = require('../models/Setting');
const User = require('../models/User');
const Product = require('../models/Product');
const PaymentAccount = require('../models/PaymentAccount');

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
      { key: 'welcomeBonus', value: 1000 },
      { key: 'referralBonus', value: 30 },
      { key: 'bonusType', value: 'percentage' },
      { key: 'currencySymbol', value: '₦' },
      { key: 'maintenanceMode', value: false },
      { key: 'contactTelegramChannel', value: 'https://t.me/earnersmatter' },
      { key: 'contactTelegramAdmin', value: 'https://t.me/earnersmatter_admin' },
      { key: 'defaultAdLink', value: '' },
      { key: 'defaultAdImage', value: '' },
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

    const products = [
      { name: 'iPhone 7', price: 4000, dailyEarnings: 600, duration: 30, description: 'iPhone 7 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-7.png' },
      { name: 'iPhone 8', price: 8000, dailyEarnings: 1200, duration: 30, description: 'iPhone 8 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-8.png' },
      { name: 'iPhone X', price: 15000, dailyEarnings: 2250, duration: 30, description: 'iPhone X investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-x.png' },
      { name: 'iPhone XR', price: 25000, dailyEarnings: 3750, duration: 30, description: 'iPhone XR investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-xr.png' },
      { name: 'iPhone 11', price: 30000, dailyEarnings: 4500, duration: 30, description: 'iPhone 11 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-11.png' },
      { name: 'iPhone 12', price: 50000, dailyEarnings: 7500, duration: 30, description: 'iPhone 12 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-12.png' },
      { name: 'iPhone 13', price: 70000, dailyEarnings: 10500, duration: 30, description: 'iPhone 13 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-13.png' },
      { name: 'iPhone 14', price: 100000, dailyEarnings: 15000, duration: 30, description: 'iPhone 14 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-14.png' },
      { name: 'iPhone 15', price: 300000, dailyEarnings: 45000, duration: 30, description: 'iPhone 15 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-15.png' },
      { name: 'iPhone 16', price: 500000, dailyEarnings: 75000, duration: 30, description: 'iPhone 16 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-16.png' },
      { name: 'iPhone 17', price: 700000, dailyEarnings: 105000, duration: 30, description: 'iPhone 17 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-17.png' },
      { name: 'iPhone 18', price: 1000000, dailyEarnings: 150000, duration: 30, description: 'iPhone 18 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-18.png' },
      { name: 'iPhone 19', price: 2000000, dailyEarnings: 300000, duration: 30, description: 'iPhone 19 investment slot — earn 15% daily', status: 'active', image: '/images/products/iphone-19.png' },
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
