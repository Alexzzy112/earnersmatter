const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
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
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create uploads directory:', e.message);
}
// Serve uploaded files via API route (works on Vercel serverless)
app.get('/api/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Routes
app.use('/api', routes);



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
