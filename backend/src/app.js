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

// PERBAIKAN: Timeout configuration berdasarkan ukuran file
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
  if (req.path === '/api/predict-file') {
    if (fileSizeMB > 100) {
      req.setTimeout(14400000);
      res.setTimeout(14400000);
      console.log(`⏰ Setting 4-hour timeout for ${fileSizeMB.toFixed(2)}MB file`);
    } else if (fileSizeMB > 50) {
      req.setTimeout(7200000);
      res.setTimeout(7200000);
      console.log(`⏰ Setting 2-hour timeout for ${fileSizeMB.toFixed(2)}MB file`);
    } else {
      req.setTimeout(3600000);
      res.setTimeout(3600000);
      console.log(`⏰ Setting 1-hour timeout for ${fileSizeMB.toFixed(2)}MB file`);
    }
  } else {
    req.setTimeout(600000);
    res.setTimeout(600000);
  }
  next();
});

// PERBAIKAN: Enhanced CORS configuration untuk mengatasi masalah domain custom
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://optipredict.my.id',
          'https://www.optipredict.my.id',
          'http://optipredict.my.id',    // PERBAIKAN: Support HTTP
          'http://www.optipredict.my.id', // PERBAIKAN: Support HTTP
          'http://20.189.116.138:3000'
        ]
      : [
          'http://20.189.116.138:3000',
          'http://localhost:3000',
          'http://127.0.0.1:3000'
        ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for debugging, but log blocked ones
    }
  },
  credentials: true, // PENTING: Untuk cookie cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-access-token',
    'Origin',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['set-cookie', 'x-new-token'], // PENTING: Expose cookie headers
  optionsSuccessStatus: 200, // Support legacy browsers
  preflightContinue: false
};

// PERBAIKAN: Apply CORS middleware paling awal untuk menghindari konflik
app.use(cors(corsOptions));

// PERBAIKAN: Explicit preflight handling untuk semua routes
app.options('*', (req, res) => {
  console.log('🔄 Preflight request for:', req.path, 'from origin:', req.get('origin'));
  res.header('Access-Control-Allow-Origin', req.get('origin'));
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token, Origin, X-Requested-With, Accept, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// PERBAIKAN: Enhanced logging middleware untuk debugging CORS
app.use((req, res, next) => {
  const origin = req.get('origin');
  console.log(`📡 ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request detected');
    console.log('Request headers:', req.headers);
  }
  
  // Log response headers untuk debugging
  const originalSend = res.send;
  res.send = function(data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 Response headers for ${req.path}:`, {
        'access-control-allow-origin': res.get('access-control-allow-origin'),
        'access-control-allow-credentials': res.get('access-control-allow-credentials')
      });
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Middleware order yang benar setelah CORS
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const FLASK_ML_URL = 'http://20.189.116.138:5001';

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.originalname.toLowerCase().slice(-4);
    if (allowedTypes.some(type => file.originalname.toLowerCase().endsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya .csv, .xlsx, .xls yang diizinkan.'));
    }
  }
});

// Routes dengan CORS yang sudah dikonfigurasi
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// PERBAIKAN: Enhanced auth check endpoint dengan token refresh dan CORS handling
app.get('/api/auth/check', async (req, res) => {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('🔍 Auth check request received');
    console.log('Request origin:', req.get('origin'));
    console.log('Token exists:', !!token);
    console.log('Cookies received:', Object.keys(req.cookies || {}));
    
    if (!token) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Token tidak ditemukan' 
      });
    }
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
      
      if (users.length === 0) {
        return res.status(401).json({ 
          authenticated: false, 
          message: 'User tidak ditemukan di database' 
        });
      }
      
      const user = users[0];
      console.log('✅ User authenticated:', { id: user.id, name: user.name });
      
      // PERBAIKAN: Token refresh mechanism
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      
      let newToken = token;
      if (timeUntilExpiry < oneHour) {
        newToken = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
          expiresIn: config.jwtExpire || '24h'
        });
        
        // PERBAIKAN: Set new cookie dengan konfigurasi domain yang tepat
        const cookieOptions = {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/',
          secure: false, // PERBAIKAN: Set false untuk HTTP
          sameSite: 'lax' // PERBAIKAN: Gunakan 'lax' untuk HTTP
        };
        
        if (process.env.NODE_ENV === 'production') {
          cookieOptions.domain = '.my.id';
        }
        
        res.cookie('token', newToken, cookieOptions);
        console.log('🔄 Token refreshed for user:', user.id);
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
      console.log('❌ JWT verification failed:', jwtError.message);
      
      // PERBAIKAN: Clear invalid cookie
      const cookieOptions = {
        httpOnly: true,
        path: '/',
        secure: false,
        sameSite: 'lax'
      };
      
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.domain = '.my.id';
      }
      
      cookieOptions.expires = new Date(0);
      res.clearCookie('token', cookieOptions);
      
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Token tidak valid atau expired' 
      });
    }
  } catch (error) {
    console.error('❌ Error in auth check:', error);
    res.status(500).json({ 
      authenticated: false, 
      message: 'Error internal server' 
    });
  }
});

// Semua endpoint lainnya tetap sama...
app.post('/api/predict', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;
    if (!data.userId) {
      data.userId = userId;
    }
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
    console.error('❌ Error /api/predict:', error.message);
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'Flask ML service tidak tersedia' });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(408).json({ success: false, message: 'Request timeout ke Flask ML service' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Endpoint lainnya (predictions, predict-file, dll.) tetap sama seperti sebelumnya...

// PERBAIKAN: Enhanced error handling middleware untuk CORS
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: 'CORS policy violation',
      origin: req.get('origin'),
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://optipredict.my.id', 'http://optipredict.my.id']
        : ['http://localhost:3000', 'http://127.0.0.1:3000']
    });
  }
  
  // Handle multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File terlalu besar. Maksimal 500MB.'
      });
    }
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// PERBAIKAN: Health check endpoint dengan informasi debug
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    origin: req.get('origin'),
    host: req.get('host'),
    cookies: Object.keys(req.cookies || {}),
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://optipredict.my.id', 'http://optipredict.my.id']
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 CORS Origins: ${process.env.NODE_ENV === 'production' ? 'optipredict.my.id (HTTP/HTTPS)' : 'localhost:3000'}`);
  console.log(`⏰ Extended timeout untuk file besar: 4 jam maksimal`);
  console.log(`📊 Support untuk file hingga 500MB`);
});

server.timeout = 14400000;
server.keepAliveTimeout = 14400000;
server.headersTimeout = 14400000;

module.exports = app;
