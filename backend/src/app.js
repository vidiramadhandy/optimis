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

app.use(express.static('public'));

// Timeout for file uploads
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

// CORS Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://20.189.116.138:3000', 'http://optipredict.my.id'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

// Handle OPTIONS preflight requests for all routes
app.options('*', cors());  // This allows preflight requests

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

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

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.redirect('/login')
})

// Endpoint untuk cek autentikasi
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
      return res.status(401).json({ authenticated: false, message: 'Token tidak valid atau expired' });
    }
  } catch (error) {
    res.status(500).json({ authenticated: false, message: 'Error internal server' });
  }
});

// ENDPOINT MANUAL PREDICT (TAMBAHAN)
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

// Endpoint history
app.get('/api/predictions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit || 50;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const flaskResponse = await axios.get(
      `${FLASK_ML_URL}/predictions/${userId}?limit=${limit}`,
      {
        timeout: 30000,
        validateStatus: function (status) {
          return status < 600;
        }
      }
    );
    if (flaskResponse.status === 200) {
      res.json(flaskResponse.data);
    } else {
      res.status(flaskResponse.status).json({
        success: false,
        message: 'Failed to retrieve history from ML service'
      });
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia. Pastikan Flask berjalan di port 5001.'
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(408).json({
        success: false,
        message: 'Request timeout saat mengambil history.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil history predictions',
        error: error.message
      });
    }
  }
});

app.delete('/api/predictions/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const flaskResponse = await axios.delete(
      `${FLASK_ML_URL}/predictions/all/${userId}`,
      {
        timeout: 30000,
        validateStatus: function (status) {
          return status < 600;
        }
      }
    );
    if (flaskResponse.status === 200) {
      res.json(flaskResponse.data);
    } else {
      res.status(flaskResponse.status).json({
        success: false,
        message: 'Failed to delete predictions'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus predictions',
      error: error.message
    });
  }
});

app.delete('/api/prediction/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const predictionId = req.params.id;
    if (!predictionId || isNaN(predictionId)) {
      return res.status(400).json({ success: false, message: 'Invalid prediction ID' });
    }
    const flaskResponse = await axios.delete(
      `${FLASK_ML_URL}/prediction/${predictionId}?userId=${userId}`,
      {
        timeout: 30000,
        validateStatus: function (status) {
          return status < 600;
        }
      }
    );
    if (flaskResponse.status === 200) {
      res.json(flaskResponse.data);
    } else {
      res.status(flaskResponse.status).json({
        success: false,
        message: 'Failed to delete prediction'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus prediction',
      error: error.message
    });
  }
});

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

function sanitizeJsonData(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) {
      return null;
    }
    return obj;
  }
  if (typeof obj === 'string') {
    if (obj === 'NaN' || obj === 'Infinity' || obj === '-Infinity') {
      return null;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJsonData(item));
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeJsonData(value);
    }
    return sanitized;
  }
  return obj;
}

app.post('/api/predict-file', verifyToken, upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan dalam request' });
    }
    tempFilePath = req.file.path;
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (req.file.size === 0) {
      return res.status(400).json({ success: false, message: 'File kosong atau tidak valid' });
    }
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('userId', req.userId.toString());
    let timeoutDuration;
    if (fileSizeMB > 100) {
      timeoutDuration = 14400000;
    } else if (fileSizeMB > 50) {
      timeoutDuration = 7200000;
    } else if (fileSizeMB > 20) {
      timeoutDuration = 3600000;
    } else {
      timeoutDuration = 1800000;
    }
    const flaskResponse = await axios.post(
      `${FLASK_ML_URL}/predict-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        maxContentLength: 1000 * 1024 * 1024,
        maxBodyLength: 1000 * 1024 * 1024,
        timeout: timeoutDuration,
        responseType: 'text',
        validateStatus: function (status) {
          return status < 600;
        }
      }
    );
    if (flaskResponse.status >= 400) {
      return res.status(flaskResponse.status).json({
        success: false,
        message: 'Error dari Flask ML service',
        status: flaskResponse.status
      });
    }
    let responseData;
    try {
      let cleanedData = flaskResponse.data;
      cleanedData = cleanedData.replace(/^\uFEFF/, '').trim();
      cleanedData = cleanedData.replace(/:\s*NaN\s*([,}])/g, ': null$1');
      cleanedData = cleanedData.replace(/:\s*Infinity\s*([,}])/g, ': null$1');
      cleanedData = cleanedData.replace(/:\s*-Infinity\s*([,}])/g, ': null$1');
      responseData = JSON.parse(cleanedData);
      responseData = sanitizeJsonData(responseData);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Response dari Flask ML service mengandung data tidak valid (NaN values)',
        error: parseError.message
      });
    }
    const requiredFields = ['success', 'message', 'total_rows', 'processed_rows', 'results'];
    const missingFields = requiredFields.filter(field => responseData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(500).json({
        success: false,
        message: `Response dari Flask ML service tidak lengkap. Missing fields: ${missingFields.join(', ')}`
      });
    }
    let optimizedResults = responseData.results;
    let isLimited = false;
    if (responseData.results && responseData.results.length > 10000) {
      optimizedResults = responseData.results.slice(0, 10000);
      isLimited = true;
      responseData.message = `${responseData.message} (Menampilkan 10,000 baris pertama dari ${responseData.processed_rows} total baris)`;
    }
    const finalResponse = {
      success: Boolean(responseData.success),
      message: String(responseData.message || ''),
      total_rows: Number(responseData.total_rows || 0),
      processed_rows: Number(responseData.processed_rows || 0),
      valid_rows: Number(responseData.valid_rows || 0),
      displayed_rows: optimizedResults ? optimizedResults.length : 0,
      is_limited: isLimited,
      user_id: req.userId,
      processing_time: `${Math.round(timeoutDuration/60000)} minutes timeout`,
      results: Array.isArray(optimizedResults) ? optimizedResults : []
    };
    try {
      await db.query(`
        INSERT INTO excel_inputs (
          user_id, original_filename, file_size_bytes, total_rows, 
          valid_rows, processed_rows, status, created_at, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        req.userId,
        req.file.originalname,
        req.file.size,
        finalResponse.total_rows,
        finalResponse.valid_rows,
        finalResponse.processed_rows,
        'success'
      ]);
    } catch {}
    res.json(finalResponse);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Flask ML service tidak tersedia. Pastikan Flask berjalan di port 5001.'
      });
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      const fileSizeMB = req.file ? req.file.size / (1024 * 1024) : 0;
      res.status(408).json({
        success: false,
        message: `Request timeout untuk file ${fileSizeMB.toFixed(2)}MB. File sangat besar membutuhkan waktu pemrosesan yang lama. Pertimbangkan untuk membagi file menjadi bagian yang lebih kecil (maksimal 50MB per file).`
      });
    } else if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'Error dari Flask ML service'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan prediksi batch untuk file besar',
        error: error.message
      });
    }
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Express server berjalan di http://localhost:${PORT}`);
  console.log(`⏰ Extended timeout untuk file besar: 4 jam maksimal`);
  console.log(`📊 Support untuk file hingga 500MB`);
  console.log(`🔐 Menangani autentikasi dan routing ke ML service`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - POST /api/predict (manual predict)`);
  console.log(`   - POST /api/predict-file (batch prediction)`);
  console.log(`   - GET  /api/predictions (history)`);
  console.log(`   - DELETE /api/predictions/all (delete all)`);
  console.log(`   - DELETE /api/prediction/:id (delete one)`);
  console.log(`   - GET  /api/ml-health (health check)`);
});

server.timeout = 14400000;
server.keepAliveTimeout = 14400000;
server.headersTimeout = 14400000;

module.exports = app;
