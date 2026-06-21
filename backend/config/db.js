const mongoose = require('mongoose');
const dns = require('dns');

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const buildDirectURI = async (srvUri) => {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  const hostMatch = srvUri.match(/cluster0\.([^.]+)\.mongodb\.net/);
  const projectId = hostMatch ? hostMatch[1] : null;
  if (!projectId) throw new Error('Could not determine project ID from MONGODB_URI');
  const ads = await dns.promises.resolveSrv(`_mongodb._tcp.cluster0.${projectId}.mongodb.net`);
  const hosts = ads.map(a => `${a.name}:${a.port}`).join(',');
  const m = srvUri.match(/\/\/(.+?):(.+?)@.+\/(.+?)\?(.+)/);
  if (!m) throw new Error('Could not parse MONGODB_URI');
  const [, user, pass, dbName, params] = m;
  return { uri: `mongodb://${hosts}/${dbName}?${params}&authSource=admin`, user, pass };
};

const getConnectOptions = (isProd) => ({
  maxPoolSize: isProd ? 50 : 10,
  minPoolSize: isProd ? 5 : 0,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
  readPreference: isProd ? 'secondaryPreferred' : 'primary',
});

const connectDB = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const isProd = process.env.NODE_ENV === 'production';
    const srvUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/earnersmatter';
    const isSrv = srvUri.startsWith('mongodb+srv://');

    const tryConnect = async () => {
      try {
        await mongoose.connect(srvUri, getConnectOptions(isProd));
        return;
      } catch (err) {
        if (!isSrv || (!err.message?.includes('querySrv') && err.code !== 'ECONNREFUSED')) {
          throw err;
        }
      }
      const { uri, user, pass } = await buildDirectURI(srvUri);
      await mongoose.connect(uri, { ...getConnectOptions(isProd), tls: true, user, pass, serverSelectionTimeoutMS: 10000 });
    };

    cached.promise = tryConnect();
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
