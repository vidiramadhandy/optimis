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

// **PERBAIKAN 1: Konfigurasi CORS yang lebih robust**
const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (untuk mobile apps, Postman, dll)
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
  optionsSuccessStatus: 200, // **PENTING: Untuk browser lama**
  preflightContinue: false
};

// **PERBAIKAN 2: Urutan middleware yang benar**
// 1. CORS harus di-setup pertama kali
app.use(cors(corsOptions));

// 2. Handle preflight untuk semua route
app.options('*', cors(corsOptions));

// **PERBAIKAN 3: Eksplisit OPTIONS handler untuk memastikan**
app.use('/api/*', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.get('origin');
    console.log('🔍 Handling OPTIONS request for:', req.path, 'from origin:', origin);
    
    // Set headers secara eksplisit
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token, Origin, X-Requested-With, Accept, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    return res.sendStatus(200);
  }
  next();
});

// **PERBAIKAN 4: Logging yang lebih detail**
app.use((req, res, next) => {
  const origin = req.get('origin');
  const timestamp = new Date().toISOString();
  console.log(`📡 [${timestamp}] ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  // Debug khusus untuk OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS Headers:', {
      'access-control-request-method': req.get('access-control-request-method'),
      'access-control-request-headers': req.get('access-control-request-headers'),
      'origin': origin
    });
  }
  
  next();
});

// 3. Middleware lainnya
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// **PERBAIKAN 5: Timeout configuration yang lebih baik**
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
  
  if (req.path === '/api/predict-file') {
    if (fileSizeMB > 100) {
      req.setTimeout(14400000); // 4 jam
      res.setTimeout(14400000);
    } else if (fileSizeMB > 50) {
      req.setTimeout(7200000); // 2 jam
      res.setTimeout(7200000);
    } else {
      req.setTimeout(3600000); // 1 jam
    }
  } else {
    req.setTimeout(600000); // 10 menit untuk request biasa
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

// **PERBAIKAN 6: Cookie options yang lebih spesifik**
const cookieOptions = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  secure: true,
  sameSite: 'lax',
  domain: 'optipredict.my.id' // Lebih spesifik daripada '.my.id'
};

// **PERBAIKAN 7: Health check endpoint yang konsisten**
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    origin: req.get('origin'),
    host: req.get('host'),
    cookies: Object.keys(req.cookies || {}),
    version: '1.0.0'
  });
});

// Routes - pastikan setelah semua middleware CORS
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Endpoint auth check dengan token refresh
app.get('/api/auth/check', async (req, res) => {
  try {
    const token = req.headers['x-access-token'] ||
                  req.cookies.token ||
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
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
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      let newToken = token;

      if (timeUntilExpiry < oneHour) {
        newToken = jwt.sign(
          { id: user.id, email: user.email }, 
          config.jwtSecret, 
          { expiresIn: config.jwtExpire || '24h' }
        );
        res.cookie('token', newToken, cookieOptions);
        res.header('x-new-token', newToken); // **PERBAIKAN: Expose token di header**
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
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Token tidak valid atau expired' 
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ 
      authenticated: false, 
      message: 'Error internal server' 
    });
  }
});

// Endpoint predict
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
    console.error('Predict error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// **PERBAIKAN 8: Endpoint untuk file upload**
app.post('/api/predict-file', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: file.mimetype
    });
    formData.append('userId', userId.toString());

    const flaskResponse = await axios.post(
      `${FLASK_ML_URL}/predict-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: req.timeout || 3600000,
        maxContentLength: 500 * 1024 * 1024,
        maxBodyLength: 500 * 1024 * 1024,
        validateStatus: status => status < 600
      }
    );

    // Hapus file temporary
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    if (flaskResponse.status === 200) {
      res.json({
        success: true,
        data: flaskResponse.data,
        message: 'Prediksi file berhasil'
      });
    } else {
      res.status(flaskResponse.status).json({
        success: false,
        message: flaskResponse.data?.message || 'Prediksi file gagal'
      });
    }

  } catch (error) {
    console.error('Error in predict-file:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error internal server saat memproses file'
    });
  }
});

// **PERBAIKAN 9: Error handling middleware yang lebih baik**
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      message: 'CORS policy violation',
      origin: req.get('origin')
    });
  }
  
  if (err.message && err.message.includes('Format file tidak didukung')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// **PERBAIKAN 10: Catch-all untuk route yang tidak ditemukan**
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route tidak ditemukan',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Express server berjalan di https://optipredict.my.id:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 CORS enabled for: https://optipredict.my.id, https://www.optipredict.my.id`);
});

server.timeout = 14400000;
server.keepAliveTimeout = 14400000;
server.headersTimeout = 14400000;

module.exports = app;
