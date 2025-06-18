const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { verifyToken } = require('./middleware/auth');
const config = require('./config');
const db = require('./db');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const app = express();

// Konfigurasi CORS hanya untuk HTTPS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'https://optipredict.my.id',
      'https://www.optipredict.my.id'
    ];
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-access-token',
    'Origin',
    'X-Requested-With',
    'Accept',
    'Cache-Control'
  ],
  exposedHeaders: ['set-cookie', 'x-new-token'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging dan middleware dasar
app.use((req, res, next) => {
  const origin = req.get('origin');
  console.log(`📡 ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  next();
});
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Timeout configuration
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
  if (req.path === '/api/predict-file') {
    if (fileSizeMB > 100) {
      req.setTimeout(14400000);
      res.setTimeout(14400000);
    } else if (fileSizeMB > 50) {
      req.setTimeout(7200000);
      res.setTimeout(7200000);
    } else {
      req.setTimeout(3600000);
      res.setTimeout(3600000);
    }
  } else {
    req.setTimeout(600000);
    res.setTimeout(600000);
  }
  next();
});

const FLASK_ML_URL = 'http://20.189.116.138:5001';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    if (allowedTypes.some(type => file.originalname.toLowerCase().endsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya .csv, .xlsx, .xls yang diizinkan.'));
    }
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Konfigurasi cookie untuk HTTPS
const cookieOptions = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  secure: true, // WAJIB true untuk HTTPS
  sameSite: 'lax',
  domain: '.my.id'
};

// Endpoint auth check dengan token refresh
app.get('/api/auth/check', async (req, res) => {
  try {
    const token = req.headers['x-access-token'] ||
                  req.cookies.token ||
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    if (!token) {
      return res.status(401).json({ authenticated: false, message: 'Token tidak ditemukan' });
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0) {
        return res.status(401).json({ authenticated: false, message: 'User tidak ditemukan di database' });
      }
      const user = users[0];
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      let newToken = token;
      if (timeUntilExpiry < oneHour) {
        newToken = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
          expiresIn: config.jwtExpire || '24h'
        });
        res.cookie('token', newToken, cookieOptions);
      }
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token: newToken,
        message: 'User terautentikasi'
      });
    } catch (jwtError) {
      const expiredOptions = { ...cookieOptions, expires: new Date(0) };
      res.clearCookie('token', expiredOptions);
      return res.status(401).json({ authenticated: false, message: 'Token tidak valid atau expired' });
    }
  } catch (error) {
    res.status(500).json({ authenticated: false, message: 'Error internal server' });
  }
});

// Contoh endpoint lain (endpoint lain tetap sama, gunakan verifyToken dan cookieOptions yang sama)
app.post('/api/predict', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;
    if (!data.userId) data.userId = userId;
    const flaskResponse = await axios.post(
      `${FLASK_ML_URL}/predict`,
      data,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
        validateStatus: status => status < 600
      }
    );
    if (flaskResponse.status === 200) {
      res.json(flaskResponse.data);
    } else {
      res.status(flaskResponse.status).json({
        success: false,
        message: flaskResponse.data?.message || 'Prediction failed'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      message: 'CORS policy violation',
      origin: req.get('origin')
    });
  }
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    origin: req.get('origin'),
    host: req.get('host'),
    cookies: Object.keys(req.cookies || {})
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Express server berjalan di https://optipredict.my.id:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});
server.timeout = 14400000;
server.keepAliveTimeout = 14400000;
server.headersTimeout = 14400000;

module.exports = app;
