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

const FLASK_ML_URL = 'http://127.0.0.1:5001';

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

// **PERBAIKAN 9: PREDICTIONS ENDPOINTS - SESUAI DATABASE SCHEMA**
// Get predictions dengan limit dan pagination
app.get('/api/predictions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    console.log(`📊 Getting predictions for user ${userId}, limit: ${limit}, offset: ${offset}`);
    
    // Validasi input
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }
    
    if (isNaN(offset) || offset < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset must be 0 or greater'
      });
    }
    
    // Query predictions dengan kolom yang sesuai database schema
    const [predictions] = await db.query(
      `SELECT id, user_id, snr, inputs, prediction, confidence, created_at, 
              prediction_number, snr_normalized, quality_assessment, input_type, model_version
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
    
    const total = countResult[0]?.total || 0;
    
    // Format data untuk frontend dengan backward compatibility
    const formattedPredictions = predictions.map(pred => ({
      id: pred.id,
      user_id: pred.user_id,
      snr: pred.snr,
      inputs: pred.inputs,
      prediction: pred.prediction,
      confidence: pred.confidence,
      created_at: pred.created_at,
      prediction_number: pred.prediction_number,
      snr_normalized: pred.snr_normalized,
      quality_assessment: pred.quality_assessment,
      input_type: pred.input_type,
      model_version: pred.model_version,
      // Backward compatibility untuk frontend yang masih menggunakan nama lama
      input_data: pred.inputs,
      prediction_result: pred.prediction
    }));
    
    res.json({
      success: true,
      data: formattedPredictions,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < total
      },
      message: 'Predictions retrieved successfully'
    });
    
  } catch (error) {
    console.error('🚨 Error in /api/predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get all predictions (tanpa limit)
app.get('/api/predictions/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`📊 Getting all predictions for user ${userId}`);
    
    const [predictions] = await db.query(
      `SELECT id, user_id, snr, inputs, prediction, confidence, created_at, 
              prediction_number, snr_normalized, quality_assessment, input_type, model_version
       FROM predictions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Format dengan backward compatibility
    const formattedPredictions = predictions.map(pred => ({
      ...pred,
      input_data: pred.inputs,
      prediction_result: pred.prediction
    }));
    
    res.json({
      success: true,
      data: formattedPredictions,
      count: predictions.length,
      message: 'All predictions retrieved successfully'
    });
    
  } catch (error) {
    console.error('🚨 Error getting all predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get prediction by ID
app.get('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const predictionId = parseInt(req.params.id);
    
    if (isNaN(predictionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID'
      });
    }
    
    console.log(`📊 Getting prediction ${predictionId} for user ${userId}`);
    
    const [predictions] = await db.query(
      `SELECT id, user_id, snr, inputs, prediction, confidence, created_at, 
              prediction_number, snr_normalized, quality_assessment, input_type, model_version
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
    
    const prediction = predictions[0];
    // Add backward compatibility
    prediction.input_data = prediction.inputs;
    prediction.prediction_result = prediction.prediction;
    
    res.json({
      success: true,
      data: prediction,
      message: 'Prediction retrieved successfully'
    });
    
  } catch (error) {
    console.error('🚨 Error getting prediction by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Save new prediction result - SESUAI DATABASE SCHEMA
app.post('/api/predictions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      snr, 
      inputs, 
      prediction, 
      confidence, 
      prediction_number, 
      snr_normalized, 
      quality_assessment, 
      input_type, 
      model_version 
    } = req.body;
    
    if (!inputs || !prediction) {
      return res.status(400).json({
        success: false,
        message: 'inputs and prediction are required'
      });
    }
    
    console.log(`💾 Saving prediction for user ${userId}`);
    
    const [result] = await db.query(
      `INSERT INTO predictions (user_id, snr, inputs, prediction, confidence, 
                               prediction_number, snr_normalized, quality_assessment, 
                               input_type, model_version, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId, 
        snr || null,
        typeof inputs === 'string' ? inputs : JSON.stringify(inputs),
        prediction,
        confidence || 0,
        prediction_number || 1,
        snr_normalized || null,
        quality_assessment || 'High',
        input_type || 'Manual',
        model_version || '2.0'
      ]
    );
    
    // Get the saved prediction
    const [savedPrediction] = await db.query(
      `SELECT id, user_id, snr, inputs, prediction, confidence, created_at, 
              prediction_number, snr_normalized, quality_assessment, input_type, model_version
       FROM predictions WHERE id = ?`,
      [result.insertId]
    );
    
    const prediction_data = savedPrediction[0];
    // Add backward compatibility
    prediction_data.input_data = prediction_data.inputs;
    prediction_data.prediction_result = prediction_data.prediction;
    
    res.json({
      success: true,
      data: prediction_data,
      message: 'Prediction saved successfully'
    });
    
  } catch (error) {
    console.error('🚨 Error saving prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get predictions statistics
app.get('/api/predictions/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`📈 Getting prediction stats for user ${userId}`);
    
    // Get basic stats
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [userId]
    );
    
    // Get stats by prediction type
    const [typeStats] = await db.query(
      `SELECT prediction, COUNT(*) as count 
       FROM predictions 
       WHERE user_id = ? 
       GROUP BY prediction`,
      [userId]
    );
    
    // Get stats by input type
    const [inputTypeStats] = await db.query(
      `SELECT input_type, COUNT(*) as count 
       FROM predictions 
       WHERE user_id = ? 
       GROUP BY input_type`,
      [userId]
    );
    
    // Get daily stats
    const [dailyStats] = await db.query(
      `SELECT 
        DATE(created_at) as prediction_date,
        COUNT(*) as daily_count
       FROM predictions 
       WHERE user_id = ? 
       GROUP BY DATE(created_at) 
       ORDER BY prediction_date DESC 
       LIMIT 30`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        total_predictions: totalCount[0]?.total || 0,
        prediction_types: typeStats,
        input_types: inputTypeStats,
        daily_stats: dailyStats
      },
      message: 'Prediction statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('🚨 Error getting prediction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prediction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// **PERBAIKAN BARU: TAMBAHKAN DELETE ENDPOINTS UNTUK HISTORY**

// Delete prediction by ID (individual delete)
app.delete('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const predictionId = parseInt(req.params.id);
    
    if (isNaN(predictionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID'
      });
    }
    
    console.log(`🗑️ Deleting prediction ${predictionId} for user ${userId}`);
    
    // Check if prediction exists and belongs to user
    const [existing] = await db.query(
      'SELECT id FROM predictions WHERE id = ? AND user_id = ?',
      [predictionId, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found or not authorized'
      });
    }
    
    // Delete the prediction
    const [result] = await db.query(
      'DELETE FROM predictions WHERE id = ? AND user_id = ?',
      [predictionId, userId]
    );
    
    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Prediction deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }
    
  } catch (error) {
    console.error('🚨 Error deleting prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Delete all predictions for user (delete all history)
app.delete('/api/predictions/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`🗑️ Deleting ALL predictions for user ${userId}`);
    
    // Get count before deletion for confirmation
    const [countBefore] = await db.query(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [userId]
    );
    
    const totalBefore = countBefore[0]?.total || 0;
    
    if (totalBefore === 0) {
      return res.json({
        success: true,
        message: 'No predictions to delete',
        deletedCount: 0
      });
    }
    
    // Delete all predictions for the user
    const [result] = await db.query(
      'DELETE FROM predictions WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} predictions`,
      deletedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('🚨 Error deleting all predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Delete multiple predictions by IDs (batch delete)
app.delete('/api/predictions/batch', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { predictionIds } = req.body;
    
    if (!predictionIds || !Array.isArray(predictionIds) || predictionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'predictionIds array is required and must not be empty'
      });
    }
    
    // Validate all IDs are numbers
    const validIds = predictionIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid prediction IDs provided'
      });
    }
    
    console.log(`🗑️ Batch deleting ${validIds.length} predictions for user ${userId}`);
    
    // Check which predictions exist and belong to user
    const placeholders = validIds.map(() => '?').join(',');
    const [existing] = await db.query(
      `SELECT id FROM predictions WHERE id IN (${placeholders}) AND user_id = ?`,
      [...validIds, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No predictions found or not authorized'
      });
    }
    
    // Delete the predictions
    const [result] = await db.query(
      `DELETE FROM predictions WHERE id IN (${placeholders}) AND user_id = ?`,
      [...validIds, userId]
    );
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} predictions`,
      deletedCount: result.affectedRows,
      requestedCount: validIds.length
    });
    
  } catch (error) {
    console.error('🚨 Error batch deleting predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error batch deleting predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Delete predictions by date range
app.delete('/api/predictions/range', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }
    
    console.log(`🗑️ Deleting predictions from ${startDate} to ${endDate} for user ${userId}`);
    
    // Get count before deletion
    const [countBefore] = await db.query(
      `SELECT COUNT(*) as total FROM predictions 
       WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );
    
    const totalBefore = countBefore[0]?.total || 0;
    
    if (totalBefore === 0) {
      return res.json({
        success: true,
        message: 'No predictions found in the specified date range',
        deletedCount: 0
      });
    }
    
    // Delete predictions in date range
    const [result] = await db.query(
      `DELETE FROM predictions 
       WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} predictions from ${startDate} to ${endDate}`,
      deletedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('🚨 Error deleting predictions by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting predictions by date range',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// **PERBAIKAN 10: Predict Endpoints - UPDATE UNTUK MENYIMPAN SESUAI SCHEMA**
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
      // Simpan hasil prediksi ke database dengan schema yang benar
      try {
        await db.query(
          `INSERT INTO predictions (user_id, snr, inputs, prediction, confidence, 
                                   prediction_number, snr_normalized, quality_assessment, 
                                   input_type, model_version, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            data.snr || null,
            JSON.stringify(data.inputs || data),
            flaskResponse.data.prediction || 'Unknown',
            flaskResponse.data.confidence || 0,
            1, // prediction_number
            data.snr_normalized || null,
            'High', // quality_assessment
            'Manual', // input_type
            '2.0' // model_version
          ]
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
      `${FLASK_ML_URL}/api/predict-file`,
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
      // Simpan hasil prediksi file ke database dengan schema yang benar
      try {
        await db.query(
          `INSERT INTO predictions (user_id, snr, inputs, prediction, confidence, 
                                   prediction_number, snr_normalized, quality_assessment, 
                                   input_type, model_version, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            null, // snr
            JSON.stringify({file: file.originalname}),
            flaskResponse.data.prediction || 'File Prediction',
            flaskResponse.data.confidence || 0,
            1, // prediction_number
            null, // snr_normalized
            'High', // quality_assessment
            'Excel File', // input_type
            '2.0' // model_version
          ]
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
  console.log(`🗑️ Delete endpoints: DELETE /api/prediction/:id, DELETE /api/predictions/all`);
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
