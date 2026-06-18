const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./config/db');
const routes = require('./routes');
const uploadsDir = require('./config/upload');
const sanitizeInput = require('./middleware/sanitize');

const app = express();

// Compression - gzip responses
app.use(compression({ level: 6, threshold: 1024 }));

// Trust proxy for rate limiting behind Vercel/reverse proxy
app.set('trust proxy', 1);

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https:'],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());

// Serve uploaded files (filename is server-generated UUID, not user input)
app.get('/api/uploads/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, safeName);
  if (fs.existsSync(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Rate limiting (before body parsing to prevent resource exhaustion)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const financialLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api/deposits', financialLimiter);
app.use('/api/withdrawals', financialLimiter);
app.use('/api/investments', financialLimiter);
app.use('/api', apiLimiter);

// Body parsing & sanitization
app.use(mongoSanitize());
app.use(sanitizeInput);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API cache control
app.use('/api', (req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Routes
app.use('/api', routes);

// Health check with DB status
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus[dbState] || 'unknown',
    uptime: process.uptime(),
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';
  if (status === 500) console.error('[ERROR]', err.stack || err);
  res.status(status).json({ success: false, message });
});

// Start server only when run directly (not on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(async () => {
    const cronJobs = require('./cron/tasks');
    try {
      const result = await cronJobs.generateDailyTasks();
      console.log(result.message);
    } catch (err) {
      console.error('Initial task generation error:', err.message);
    }
    require('./cron/earnings');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  });
}

module.exports = app;
