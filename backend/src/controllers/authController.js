// backend/src/controllers/authController.js - PERBAIKAN LENGKAP UNTUK AZURE
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs'); // GANTI DARI bcryptjs KE bcrypt-nodejs
const db = require('../db');
const config = require('../config');

// Helper function untuk hash password dengan bcrypt-nodejs
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, null, null, (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
};

// Helper function untuk compare password dengan bcrypt-nodejs
const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Register user
async function register(req, res) {
  try {
    console.log('📝 Registration request received:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    
    const { name, email, password } = req.body;
    
    // Validasi input yang lebih ketat
    if (!name || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, dan password harus diisi',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }
    
    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }
    
    // Check if the email is already in use
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Email sudah digunakan' 
      });
    }
    
    // Hash the password menggunakan bcrypt-nodejs
    const hashedPassword = await hashPassword(password);
    console.log('🔐 Password hashed successfully');
    
    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    console.log('✅ User registered successfully:', { id: result.insertId, email });
    
    // Return success response dengan format yang konsisten
    const response = {
      success: true,
      message: 'Registrasi berhasil',
      data: {
        userId: result.insertId,
        name: name,
        email: email
      }
    };
    
    console.log('📤 Sending response:', response);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }
    
    const errorResponse = {
      success: false,
      message: 'Error saat registrasi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
}

// Login user
async function login(req, res) {
  try {
    console.log('📝 Login request received:', req.body);
    
    const { email, password } = req.body;
    
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }
    
    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Email atau password salah' 
      });
    }
    
    const user = users[0];
    
    // Verify password menggunakan bcrypt-nodejs
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Email atau password salah' 
      });
    }
    
    // Create token
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpire || '24h'
    });
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    console.log('✅ User logged in successfully:', { id: user.id, email: user.email });
    
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error saat login',
      error: error.message 
    });
  }
}

// Logout user
function logout(req, res) {
  res.clearCookie('token');
  console.log('✅ User logged out successfully');
  res.json({ 
    success: true,
    message: 'Logout berhasil' 
  });
}

// Check authentication status
async function checkAuth(req, res) {
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
      
      // Cek apakah user masih ada di database
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
}

// Get user data from token
async function getUserData(req, res) {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token diperlukan untuk autentikasi' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user data based on the decoded ID
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User tidak ditemukan' 
      });
    }

    const user = users[0];

    // Send user data
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error mengambil data user',
      error: error.message 
    });
  }
}

// PENTING: Ekspor semua fungsi yang digunakan di routes
module.exports = {
  register,
  login,
  logout,
  checkAuth,
  getUserData,
};
