const mongoose = require('mongoose');
const Setting = require('../../models/Setting');
const User = require('../../models/User');
const Product = require('../../models/Product');
const PaymentAccount = require('../../models/PaymentAccount');

const reseed = async (req, res) => {
  try {
    const { securityKey } = req.body;
    if (!securityKey || securityKey !== process.env.RESEED_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid security key' });
    }

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
    ];
    await Setting.insertMany(settings);

    await User.create({
      username: 'Alexzzy Admin',
      email: 'admin@earnersmatter.com',
      password: 'Admin@12345',
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
    });

    const products = [
      { name: 'iPhone 7', price: 3000, dailyEarnings: 540, duration: 30, description: 'iPhone 7 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-7.png' },
      { name: 'iPhone 8', price: 7000, dailyEarnings: 1260, duration: 30, description: 'iPhone 8 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-8.png' },
      { name: 'iPhone X', price: 15000, dailyEarnings: 2700, duration: 30, description: 'iPhone X investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-x.png' },
      { name: 'iPhone XR', price: 25000, dailyEarnings: 4500, duration: 30, description: 'iPhone XR investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-xr.png' },
      { name: 'iPhone 11', price: 30000, dailyEarnings: 5400, duration: 30, description: 'iPhone 11 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-11.png' },
      { name: 'iPhone 12', price: 50000, dailyEarnings: 9000, duration: 30, description: 'iPhone 12 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-12.png' },
      { name: 'iPhone 13', price: 70000, dailyEarnings: 12600, duration: 30, description: 'iPhone 13 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-13.png' },
      { name: 'iPhone 14', price: 100000, dailyEarnings: 18000, duration: 30, description: 'iPhone 14 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-14.png' },
      { name: 'iPhone 15', price: 300000, dailyEarnings: 54000, duration: 30, description: 'iPhone 15 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-15.png' },
      { name: 'iPhone 16', price: 500000, dailyEarnings: 90000, duration: 30, description: 'iPhone 16 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-16.png' },
      { name: 'iPhone 17', price: 700000, dailyEarnings: 126000, duration: 30, description: 'iPhone 17 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-17.png' },
      { name: 'iPhone 18', price: 1000000, dailyEarnings: 180000, duration: 30, description: 'iPhone 18 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-18.png' },
      { name: 'iPhone 19', price: 2000000, dailyEarnings: 360000, duration: 30, description: 'iPhone 19 investment slot — earn 18% daily', status: 'active', image: '/images/products/iphone-19.png' },
    ];
    await Product.insertMany(products);

    const paymentAccounts = [
      { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'EarnersMatter Ltd', isActive: true },
      { bankName: 'Access Bank', accountNumber: '9876543210', accountName: 'EarnersMatter Ltd', isActive: false },
      { bankName: 'Zenith Bank', accountNumber: '5555555555', accountName: 'EarnersMatter Ltd', isActive: false },
    ];
    await PaymentAccount.insertMany(paymentAccounts);

    res.json({ success: true, message: 'Database reseeded successfully' });
  } catch (error) {
    console.error('Reseed error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { reseed };
