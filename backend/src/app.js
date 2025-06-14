// backend/app.js - PERBAIKAN LENGKAP UNTUK AZURE
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
const path = require('path');

const app = express();

// ✅ PORT CONFIGURATION UNTUK AZURE
const PORT = process.env.PORT || 8080;

// ✅ CORS CONFIGURATION YANG LENGKAP
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://optipredict-backend-d0gmgaercxhbfc0.centralus-01.azurewebsites.net',
    'https://brave-plant-0181b0910.6.azurestaticapps.net',
    '*' // Untuk testing, nanti bisa dibatasi
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-access-token',
    'Origin',
    'Accept',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200
};

// ✅ TAMBAHKAN CORS MIDDLEWARE SEBELUM SEMUA ROUTES
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ✅ MIDDLEWARE UNTUK LOGGING REQUESTS - PINDAHKAN KE ATAS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// ✅ MIDDLEWARE DASAR DENGAN ERROR HANDLING YANG DIPERBAIKI
app.use(express.json({ 
  limit: '500mb',
  strict: false, // Tambahkan ini untuk mengatasi JSON parsing
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      try {
        JSON.parse(buf);
      } catch (error) {
        console.error('❌ JSON Parse Error:', error.message);
        console.error('❌ Raw body:', buf.toString());
        // Jangan throw error di sini, biarkan express handle
        req.jsonError = error;
      }
    }
  }
}));

app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

// ✅ MIDDLEWARE UNTUK HANDLE JSON ERROR
app.use((req, res, next) => {
  if (req.jsonError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Malformed JSON in request body'
    });
  }
  next();
});

// ✅ BUAT FOLDER UPLOADS JIKA BELUM ADA
const uploadsDir = path.join(__dirname, 'src', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  } catch (error) {
    console.log('📁 Upload directory creation failed:', error.message);
  }
}

// ✅ KONSTANTA FLASK ML URL
const FLASK_ML_URL = process.env.FLASK_ML_URL || 'http://localhost:5001';

// ✅ ENDPOINT TESTING SEDERHANA
app.get('/', (req, res) => {
  try {
    res.status(200).json({ 
      success: true,
      message: 'OptiPredict Backend API',
      status: 'Running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in root endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/test', (req, res) => {
  try {
    res.status(200).json({ 
      success: true,
      message: 'Backend working correctly',
      timestamp: new Date().toISOString(),
      status: 'OK',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in health endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ ROUTES DENGAN ERROR HANDLING
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
}

// ✅ ENDPOINT UNTUK TESTING REGISTRASI LANGSUNG
app.post('/api/test-register', async (req, res) => {
  try {
    console.log('📝 Test registration request received:', req.body);
    
    const { name, email, password } = req.body;
    
    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, dan password harus diisi'
      });
    }
    
    // Response sukses untuk testing
    res.status(201).json({
      success: true,
      message: 'Test registration berhasil',
      data: {
        name: name,
        email: email,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Test registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saat test registrasi',
      error: error.message
    });
  }
});

// ✅ ENDPOINT MANUAL PREDICT
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

// ✅ ERROR HANDLING MIDDLEWARE YANG DIPERBAIKI
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  console.error('❌ Error stack:', error.stack);
  
  // Handle specific error types
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Request body contains malformed JSON'
    });
  }
  
  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON syntax',
      error: 'Malformed JSON in request body'
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ✅ 404 HANDLER
app.use('*', (req, res) => {
  console.log('❓ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'POST /api/test-register',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/predict'
    ]
  });
});

// ✅ SERVER LISTEN DENGAN PORT 8080
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`🔗 Flask ML URL: ${FLASK_ML_URL}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - GET  / (root)`);
  console.log(`   - GET  /api/test (health check)`);
  console.log(`   - GET  /api/health (detailed health)`);
  console.log(`   - POST /api/test-register (test registration)`);
  console.log(`   - POST /api/predict (manual predict)`);
  console.log(`   - POST /api/predict-file (batch prediction)`);
  console.log(`   - GET  /api/predictions (history)`);
  console.log(`   - DELETE /api/predictions/all (delete all)`);
  console.log(`   - DELETE /api/prediction/:id (delete one)`);
  console.log(`   - GET  /api/ml-health (ML service health)`);
});

// ✅ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
