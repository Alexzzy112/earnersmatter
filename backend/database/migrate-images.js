const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Product = require('../models/Product');

const imageMap = {
  'iPhone 7': '/images/products/iphone-7.png',
  'iPhone 8': '/images/products/iphone-8.png',
  'iPhone X': '/images/products/iphone-x.png',
  'iPhone XR': '/images/products/iphone-xr.png',
  'iPhone 11': '/images/products/iphone-11.png',
  'iPhone 12': '/images/products/iphone-12.png',
  'iPhone 13': '/images/products/iphone-13.png',
  'iPhone 14': '/images/products/iphone-14.png',
  'iPhone 15': '/images/products/iphone-15.png',
  'iPhone 16': '/images/products/iphone-16.png',
  'iPhone 17': '/images/products/iphone-17.png',
  'iPhone 18': '/images/products/iphone-18.png',
  'iPhone 19': '/images/products/iphone-19.png',
};

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...');

    let updated = 0;
    for (const [name, image] of Object.entries(imageMap)) {
      const result = await Product.updateOne({ name }, { $set: { image } });
      if (result.modifiedCount > 0) {
        console.log(`  Updated: ${name} -> ${image}`);
        updated++;
      } else {
        const exists = await Product.findOne({ name });
        if (exists) {
          console.log(`  Skipped: ${name} (already up to date)`);
        } else {
          console.log(`  Not found: ${name} (no product with this name)`);
        }
      }
    }

    console.log(`\nMigration complete. ${updated} products updated.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
};

migrate();
