// backend/src/app.js
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

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

app.use(express.json());
app.use(cookieParser());

const FLASK_ML_URL = 'http://localhost:5001';

// Routes autentikasi
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Endpoint untuk cek autentikasi
app.get('/api/auth/check', async (req, res) => {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('🔍 Auth check request received');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found in auth check');
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Token tidak ditemukan' 
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('✅ Token decoded successfully:', { userId: decoded.id });
      
      const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
      
      if (users.length === 0) {
        console.log('❌ User not found in database:', decoded.id);
        return res.status(401).json({ 
          authenticated: false, 
          message: 'User tidak ditemukan di database' 
        });
      }
      
      const user = users[0];
      console.log('✅ User authenticated:', { id: user.id, name: user.name });
      
      res.json({ 
        authenticated: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        message: 'User terautentikasi'
      });
      
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
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

// Endpoint prediksi - dengan autentikasi Express
app.post('/api/predict', verifyToken, async (req, res) => {
  try {
    console.log('🔐 Authenticated request from user ID:', req.userId);
    
    const requestData = {
      ...req.body,
      userId: req.userId
    };
    
    console.log('📤 Sending to Flask ML service:', {
      userId: requestData.userId,
      inputsLength: requestData.inputs?.length,
      snr: requestData.snr
    });
    
    const response = await axios.post(`${FLASK_ML_URL}/predict`, requestData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response from Flask ML service:', response.data.success);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Error dalam routing prediksi:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'ML service tidak tersedia. Pastikan Flask berjalan di port 5001.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal menghubungi ML service'
      });
    }
  }
});

// Endpoint untuk mengambil detail prediksi berdasarkan ID
app.get('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching prediction detail for ID:', id, 'User:', req.userId);
    
    const response = await axios.get(`${FLASK_ML_URL}/prediction/${id}`, {
      params: { userId: req.userId },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching prediction detail:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail prediksi'
      });
    }
  }
});

// TAMBAHAN: Endpoint untuk menghapus prediksi berdasarkan ID
app.delete('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting prediction ID:', id, 'User:', req.userId);
    
    const response = await axios.delete(`${FLASK_ML_URL}/prediction/${id}`, {
      params: { userId: req.userId },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error deleting prediction:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus prediksi'
      });
    }
  }
});

// Endpoint untuk history prediksi user
app.get('/api/predictions', verifyToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const response = await axios.get(`${FLASK_ML_URL}/predictions/${req.userId}`, {
      params: { limit },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error mengambil history:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data history prediksi'
      });
    }
  }
});

// TAMBAHAN: Endpoint untuk menghapus semua prediksi user
app.delete('/api/predictions/all', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Deleting all predictions for user:', req.userId);
    
    const response = await axios.delete(`${FLASK_ML_URL}/predictions/all/${req.userId}`, {
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error deleting all predictions:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus semua prediksi'
      });
    }
  }
});

// Health check ML service
app.get('/api/ml-health', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_ML_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      message: 'ML service tersedia',
      mlService: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service tidak tersedia',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'OptiPredict API Server',
    version: '1.0.0',
    services: {
      auth: 'Express handles authentication',
      ml: 'Flask handles ML predictions'
    },
    endpoints: {
      auth: '/api/auth',
      authCheck: '/api/auth/check',
      predict: '/api/predict',
      predictions: '/api/predictions',
      predictionDetail: '/api/prediction/:id',
      deletePrediction: '/api/prediction/:id (DELETE)',
      deleteAllPredictions: '/api/predictions/all (DELETE)',
      mlHealth: '/api/ml-health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`🔐 Menangani autentikasi dan routing ke ML service`);
  console.log(`📋 Endpoints tersedia:`);
  console.log(`   - GET    /api/auth/check`);
  console.log(`   - POST   /api/predict`);
  console.log(`   - GET    /api/prediction/:id`);
  console.log(`   - DELETE /api/prediction/:id`);
  console.log(`   - GET    /api/predictions`);
  console.log(`   - DELETE /api/predictions/all`);
  console.log(`   - GET    /api/ml-health`);
});

module.exports = app;
