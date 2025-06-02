// backend/src/app.js - KODE LENGKAP DENGAN PERBAIKAN
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
  origin: ['http://localhost:3000', 'http://192.168.0.24:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

app.use(express.json());
app.use(cookieParser());

const FLASK_ML_URL = 'http://python-ml:5000'; // Menggunakan container name

// PERBAIKAN: Tambahkan Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'OptiPredict Backend',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

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

// PERBAIKAN: Endpoint prediksi dengan timeout dinamis untuk SNR tinggi
app.post('/api/predict', verifyToken, async (req, res) => {
  try {
    console.log('🔐 Authenticated request from user ID:', req.userId);
    
    const { inputs, snr, inputType } = req.body;
    
    // Validasi input dari frontend React
    if (!inputs || !Array.isArray(inputs) || inputs.length !== 30 || !snr) {
      return res.status(400).json({
        success: false,
        message: 'Input tidak valid - diperlukan 30 parameter dan SNR'
      });
    }
    
    // Konversi input kosong menjadi 0 (sesuai dengan frontend)
    const processedInputs = inputs.map(input => {
      if (input === '' || input === null || input === undefined) {
        return 0;
      }
      return parseFloat(input);
    });
    
    const snrValue = parseFloat(snr);
    const isHighSNR = snrValue > 10;
    
    const requestData = {
      inputs: processedInputs,
      snr: snrValue,
      userId: req.userId,
      inputType: inputType || 'Manual'
    };
    
    console.log('📤 Sending to Flask ML service:', {
      userId: requestData.userId,
      inputsLength: requestData.inputs?.length,
      snr: requestData.snr,
      isHighSNR: isHighSNR
    });
    
    // PERBAIKAN: Timeout dinamis berdasarkan nilai SNR
    let timeoutDuration;
    if (isHighSNR) {
      timeoutDuration = 180000; // 3 menit untuk SNR tinggi
      console.log('⚠️ High SNR detected, using extended timeout (3 minutes)');
    } else {
      timeoutDuration = 60000; // 1 menit untuk SNR normal
      console.log('✅ Normal SNR, using standard timeout (1 minute)');
    }
    
    const response = await axios.post(`${FLASK_ML_URL}/predict`, requestData, {
      timeout: timeoutDuration,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response from Flask ML service:', response.data.success);
    
    // Format response untuk frontend React
    if (response.data.success) {
      res.json({
        success: true,
        data: {
          id: response.data.data.id,
          prediction: response.data.data.prediction,
          confidence: response.data.data.confidence,
          quality_assessment: response.data.data.quality_assessment,
          timestamp: response.data.data.timestamp,
          user_id: response.data.data.user_id,
          manual_input_id: response.data.data.manual_input_id,
          snr_info: response.data.data.snr_info,
          model_info: response.data.data.model_info,
          user_info: response.data.data.user_info,
          processing_time: response.data.data.processing_time,
          database_status: response.data.data.database_status,
          high_snr_optimization: response.data.data.high_snr_optimization || false
        },
        message: response.data.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: response.data.message || 'Prediksi gagal'
      });
    }
    
  } catch (error) {
    console.error('❌ Error dalam routing prediksi:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'ML service tidak tersedia. Pastikan Flask berjalan di port 5001.'
      });
    } else if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
      const snrValue = parseFloat(req.body.snr);
      const isHighSNR = snrValue > 10;
      
      res.status(408).json({
        success: false,
        message: isHighSNR 
          ? 'Request timeout - SNR tinggi membutuhkan waktu lebih lama. Silakan coba lagi dalam beberapa saat.'
          : 'Request timeout - coba lagi dalam beberapa saat'
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

// Endpoint untuk menghapus prediksi berdasarkan ID
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

// Endpoint untuk menghapus semua prediksi user
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
    status: 'healthy',
    services: {
      auth: 'Express handles authentication',
      ml: 'Flask handles ML predictions with SNR optimization'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      authCheck: '/api/auth/check',
      predict: '/api/predict (optimized for high SNR)',
      predictions: '/api/predictions',
      predictionDetail: '/api/prediction/:id',
      deletePrediction: '/api/prediction/:id (DELETE)',
      deleteAllPredictions: '/api/predictions/all (DELETE)',
      mlHealth: '/api/ml-health'
    }
  });
});

// PERBAIKAN: Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// PERBAIKAN: 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`🔐 Menangani autentikasi dan routing ke ML service`);
  console.log(`⚡ Optimized untuk SNR tinggi dengan timeout dinamis`);
  console.log(`🏥 Health check tersedia di /api/health`);
  console.log(`📋 Endpoints tersedia:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/auth/check`);
  console.log(`   - POST /api/predict (timeout: 1-3 menit berdasarkan SNR)`);
  console.log(`   - GET  /api/prediction/:id`);
  console.log(`   - DELETE /api/prediction/:id`);
  console.log(`   - GET  /api/predictions`);
  console.log(`   - DELETE /api/predictions/all`);
  console.log(`   - GET  /api/ml-health`);
  
  // Test database connection
  db.query('SELECT 1')
    .then(() => console.log('✅ Koneksi database OptiPredict berhasil'))
    .catch(err => console.error('❌ Koneksi database gagal:', err.message));
});

module.exports = app;
