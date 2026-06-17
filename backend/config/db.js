const mongoose = require('mongoose');

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const isProd = process.env.NODE_ENV === 'production';
    cached.promise = mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/earnersmatter',
      {
        maxPoolSize: isProd ? 50 : 10,
        minPoolSize: isProd ? 5 : 0,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority',
        readPreference: isProd ? 'secondaryPreferred' : 'primary',
      }
    ).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      cached.conn = null;
      cached.promise = null;
    });
    mongoose.connection.on('disconnected', () => {
      cached.conn = null;
      cached.promise = null;
    });
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;
