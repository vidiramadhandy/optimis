// backend/app.js - PERBAIKAN LENGKAP UNTUK AZURE
const express = require('express');
const cors = require('cors'); // TAMBAHKAN CORS
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

// ✅ PORT CONFIGURATION UNTUK AZURE - GANTI DARI 5000 KE 8080
const PORT = process.env.PORT || 8080;

// ✅ CORS CONFIGURATION YANG LENGKAP
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://optipredict-backend-d0gmgaercxhbfc0.centralus-01.azurewebsites.net',
    'https://brave-plant-0181b0910.6.azurestaticapps.net',
    'https://your-frontend-domain.vercel.app'
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

// ✅ MIDDLEWARE DASAR DENGAN ERROR HANDLING
app.use(express.json({ 
  limit: '500mb',
  verify: (req, res, buf, encoding) => {
    try {
      if (buf && buf.length) {
        JSON.parse(buf);
      }
    } catch (error) {
      console.error('❌ JSON Parse Error:', error.message);
      res.status(400).json({
        success: false,
        message: 'Invalid JSON format',
        error: 'Malformed JSON in request body'
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

// ✅ MIDDLEWARE UNTUK LOGGING REQUESTS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ ENDPOINT TESTING SEDERHANA
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'OptiPredict Backend API',
    status: 'Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Backend working correctly',
    timestamp: new Date().toISOString(),
    status: 'OK',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
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
});

// ✅ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ... rest of your existing endpoints ...

// ✅ ERROR HANDLING MIDDLEWARE
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Request body contains malformed JSON'
    });
  }
  
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
    method: req.method
  });
});

// ✅ SERVER LISTEN DENGAN PORT 8080 DAN BIND KE 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ✅ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
