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

// **PERBAIKAN 1: CORS Configuration untuk Development dan Production**
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://optipredict.my.id',
      'https://www.optipredict.my.id',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://optipredict.my.id'
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

// **PERBAIKAN 2: Middleware Order yang Benar**
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// **PERBAIKAN 3: Explicit OPTIONS Handler**
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.get('origin');
    console.log('🔍 Handling OPTIONS request for:', req.path, 'from origin:', origin);
    
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token, Origin, X-Requested-With, Accept, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    return res.sendStatus(200);
  }
  next();
});

// **PERBAIKAN 4: Enhanced Logging**
app.use((req, res, next) => {
  const origin = req.get('origin');
  const timestamp = new Date().toISOString();
  const userAgent = req.get('user-agent')?.substring(0, 50) || 'unknown';
  
  console.log(`📡 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${origin || 'no-origin'}`);
  console.log(`   User-Agent: ${userAgent}...`);
  
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS Details:', {
      'request-method': req.get('access-control-request-method'),
      'request-headers': req.get('access-control-request-headers'),
      'origin': origin
    });
  }
  
  next();
});

// Basic middleware
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// **PERBAIKAN 5: Timeout Configuration**
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
  
  if (req.path.includes('/predict-file')) {
    if (fileSizeMB > 100) {
      req.setTimeout(14400000);
      res.setTimeout(14400000);
    } else if (fileSizeMB > 50) {
      req.setTimeout(7200000);
      res.setTimeout(7200000);
    } else {
      req.setTimeout(3600000);
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

const cookieOptions = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: process.env.NODE_ENV === 'production' ? 'optipredict.my.id' : undefined
};

// **PERBAIKAN 6: Health Check Endpoints**
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: 'connected',
    flask_ml: FLASK_ML_URL
  });
});

// **PERBAIKAN 7: Routes Registration**
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// **PERBAIKAN 8: Auth Check Endpoint**
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
        res.header('x-new-token', newToken);
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

// **PERBAIKAN 9: PREDICTIONS ENDPOINTS - SOLUSI UNTUK ERROR 404**
// Get predictions dengan limit dan pagination
app.get('/api/predictions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    console.log(`📊 Getting predictions for user ${userId}, limit: ${limit}, offset: ${offset}`);
    
    // Query predictions dengan pagination
    const [predictions] = await db.query(
      `SELECT id, input_data, prediction_result, created_at, updated_at 
       FROM predictions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    // Get total count untuk pagination
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [userId]
    );
    
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: predictions,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < total
      },
      message: 'Predictions retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving predictions',
      error: error.message
    });
  }
});

// Get all predictions (tanpa limit)
app.get('/api/predictions/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`📊 Getting all predictions for user ${userId}`);
    
    const [predictions] = await db.query(
      `SELECT id, input_data, prediction_result, created_at, updated_at 
       FROM predictions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: predictions,
      count: predictions.length,
      message: 'All predictions retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting all predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all predictions',
      error: error.message
    });
  }
});

// Get prediction by ID
app.get('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const predictionId = req.params.id;
    
    console.log(`📊 Getting prediction ${predictionId} for user ${userId}`);
    
    const [predictions] = await db.query(
      `SELECT id, input_data, prediction_result, created_at, updated_at 
       FROM predictions 
       WHERE id = ? AND user_id = ?`,
      [predictionId, userId]
    );
    
    if (predictions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }
    
    res.json({
      success: true,
      data: predictions[0],
      message: 'Prediction retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting prediction by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prediction',
      error: error.message
    });
  }
});

// Save new prediction result
app.post('/api/predictions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { input_data, prediction_result } = req.body;
    
    if (!input_data || !prediction_result) {
      return res.status(400).json({
        success: false,
        message: 'input_data and prediction_result are required'
      });
    }
    
    console.log(`💾 Saving prediction for user ${userId}`);
    
    const [result] = await db.query(
      `INSERT INTO predictions (user_id, input_data, prediction_result, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, JSON.stringify(input_data), JSON.stringify(prediction_result)]
    );
    
    // Get the saved prediction
    const [savedPrediction] = await db.query(
      'SELECT id, input_data, prediction_result, created_at, updated_at FROM predictions WHERE id = ?',
      [result.insertId]
    );
    
    res.json({
      success: true,
      data: savedPrediction[0],
      message: 'Prediction saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving prediction',
      error: error.message
    });
  }
});

// Get predictions statistics
app.get('/api/predictions/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`📈 Getting prediction stats for user ${userId}`);
    
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_predictions,
        DATE(created_at) as prediction_date,
        COUNT(*) as daily_count
       FROM predictions 
       WHERE user_id = ? 
       GROUP BY DATE(created_at) 
       ORDER BY prediction_date DESC 
       LIMIT 30`,
      [userId]
    );
    
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        total_predictions: totalCount[0].total,
        daily_stats: stats
      },
      message: 'Prediction statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting prediction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prediction statistics',
      error: error.message
    });
  }
});

// **PERBAIKAN 10: Predict Endpoints**
app.post('/api/predict', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;
    if (!data.userId) data.userId = userId;

    console.log('🔮 Prediction request from user:', userId);

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
      // Simpan hasil prediksi ke database
      try {
        await db.query(
          `INSERT INTO predictions (user_id, input_data, prediction_result, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [userId, JSON.stringify(data), JSON.stringify(flaskResponse.data)]
        );
        console.log('✅ Prediction saved to database');
      } catch (saveError) {
        console.error('Error saving prediction to database:', saveError);
      }
      
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

    console.log('📁 File prediction request:', file.originalname, 'from user:', userId);

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

    // Cleanup temp file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    if (flaskResponse.status === 200) {
      // Simpan hasil prediksi file ke database
      try {
        await db.query(
          `INSERT INTO predictions (user_id, input_data, prediction_result, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [userId, JSON.stringify({file: file.originalname}), JSON.stringify(flaskResponse.data)]
        );
        console.log('✅ File prediction saved to database');
      } catch (saveError) {
        console.error('Error saving file prediction to database:', saveError);
      }
      
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

// **PERBAIKAN 11: Error Handling Middleware**
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
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

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File terlalu besar. Maksimal 500MB.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// **PERBAIKAN 12: Catch-all Route - HARUS PALING AKHIR**
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// **PERBAIKAN 13: Server Configuration**
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for production and development origins`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Predictions API: http://localhost:${PORT}/api/predictions`);
});

// Server timeouts
server.timeout = 14400000;
server.keepAliveTimeout = 14400000;
server.headersTimeout = 14400000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;
