const Product = require('../../models/Product');

const products = [
  { name: 'iPhone 7', price: 4000, dailyEarnings: 400, duration: 30, description: 'iPhone 7 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-7.png' },
  { name: 'iPhone 8', price: 8000, dailyEarnings: 800, duration: 30, description: 'iPhone 8 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-8.png' },
  { name: 'iPhone X', price: 15000, dailyEarnings: 1500, duration: 30, description: 'iPhone X investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-x.png' },
  { name: 'iPhone XR', price: 25000, dailyEarnings: 2500, duration: 30, description: 'iPhone XR investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-xr.png' },
  { name: 'iPhone 11', price: 30000, dailyEarnings: 3000, duration: 30, description: 'iPhone 11 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-11.png' },
  { name: 'iPhone 12', price: 50000, dailyEarnings: 5000, duration: 30, description: 'iPhone 12 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-12.png' },
  { name: 'iPhone 13', price: 70000, dailyEarnings: 7000, duration: 30, description: 'iPhone 13 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-13.png' },
  { name: 'iPhone 14', price: 100000, dailyEarnings: 10000, duration: 30, description: 'iPhone 14 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-14.png' },
  { name: 'iPhone 15', price: 300000, dailyEarnings: 30000, duration: 30, description: 'iPhone 15 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-15.png' },
  { name: 'iPhone 16', price: 500000, dailyEarnings: 50000, duration: 30, description: 'iPhone 16 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-16.png' },
  { name: 'iPhone 17', price: 700000, dailyEarnings: 70000, duration: 30, description: 'iPhone 17 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-17.png' },
  { name: 'iPhone 18', price: 1000000, dailyEarnings: 100000, duration: 30, description: 'iPhone 18 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-18.png' },
  { name: 'iPhone 19', price: 2000000, dailyEarnings: 200000, duration: 30, description: 'iPhone 19 investment slot — earn 10% daily', status: 'active', image: '/images/products/iphone-19.png' },
];

const resetProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(products);
    const count = await Product.countDocuments();
    res.json({ success: true, message: `${count} products reset successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { resetProducts };
