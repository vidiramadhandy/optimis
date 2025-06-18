// backend/src/controllers/authController.js - KODE LENGKAP DIPERBAIKI
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');

// PERBAIKAN: Helper function untuk cookie options yang konsisten
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const options = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    secure: false, // PERBAIKAN: Set false untuk HTTP
    sameSite: 'lax' // PERBAIKAN: Gunakan 'lax' untuk HTTP
  };
  
  if (isProduction) {
    options.domain = '.my.id';
  }
  
  return options;
}

// PERBAIKAN: Enhanced logging function
const logAuthAttempt = (req, success, message, userId = null) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.get('origin'),
    ip: req.ip || req.connection.remoteAddress,
    success,
    message,
    userId
  };
  
  if (success) {
    console.log('✅ Auth Success:', JSON.stringify(logData, null, 2));
  } else {
    console.log('❌ Auth Failed:', JSON.stringify(logData, null, 2));
  }
};

// Register user
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    console.log('📝 Registration attempt for:', email);
    
    // Validation
    if (!name || !email || !password) {
      logAuthAttempt(req, false, 'Missing required fields');
      return res.status(400).json({ 
        message: 'Nama, email, dan password wajib diisi' 
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logAuthAttempt(req, false, 'Invalid email format');
      return res.status(400).json({ 
        message: 'Format email tidak valid' 
      });
    }
    
    // Password strength validation
    if (password.length < 6) {
      logAuthAttempt(req, false, 'Password too short');
      return res.status(400).json({ 
        message: 'Password minimal 6 karakter' 
      });
    }
    
    // Check if the email is already in use
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      logAuthAttempt(req, false, 'Email already exists');
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    logAuthAttempt(req, true, 'Registration successful', result.insertId);
    console.log('✅ User registered successfully:', { id: result.insertId, email });
    
    res.status(201).json({ 
      message: 'Registrasi berhasil',
      userId: result.insertId
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    logAuthAttempt(req, false, `Registration error: ${error.message}`);
    res.status(500).json({ message: 'Error saat registrasi' });
  }
}

// PERBAIKAN: Login user dengan cookie configuration yang tepat
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    console.log('Request origin:', req.get('origin'));
    
    // Validation
    if (!email || !password) {
      logAuthAttempt(req, false, 'Missing email or password');
      return res.status(400).json({ 
        message: 'Email dan password wajib diisi' 
      });
    }
    
    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      logAuthAttempt(req, false, 'User not found');
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logAuthAttempt(req, false, 'Invalid password', user.id);
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      }, 
      config.jwtSecret, 
      {
        expiresIn: config.jwtExpire || '24h'
      }
    );
    
    // PERBAIKAN: Set cookie dengan options yang tepat
    const cookieOptions = getCookieOptions();
    res.cookie('token', token, cookieOptions);
    
    logAuthAttempt(req, true, 'Login successful', user.id);
    console.log('✅ Login successful for:', email);
    console.log('🍪 Cookie set with options:', cookieOptions);
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token,
      message: 'Login berhasil'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    logAuthAttempt(req, false, `Login error: ${error.message}`);
    res.status(500).json({ message: 'Error saat login' });
  }
}

// PERBAIKAN: Logout user dengan cookie clearing yang tepat
function logout(req, res) {
  try {
    console.log('🚪 Logout request received');
    console.log('Request origin:', req.get('origin'));
    
    const cookieOptions = getCookieOptions();
    delete cookieOptions.maxAge;
    cookieOptions.expires = new Date(0);
    
    res.clearCookie('token', cookieOptions);
    
    console.log('✅ User logged out successfully');
    console.log('🗑️ Cookie cleared with options:', cookieOptions);
    
    res.json({ 
      message: 'Logout berhasil',
      success: true
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Error saat logout' });
  }
}

// PERBAIKAN: CheckAuth dengan token refresh
async function checkAuth(req, res) {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('🔍 Auth check request received');
    console.log('Request origin:', req.get('origin'));
    console.log('Token exists:', !!token);
    console.log('Cookies received:', Object.keys(req.cookies || {}));
    
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
      const [users] = await db.query(
        'SELECT id, name, email FROM users WHERE id = ?', 
        [decoded.id]
      );
      
      if (users.length === 0) {
        console.log('❌ User not found in database:', decoded.id);
        return res.status(401).json({ 
          authenticated: false, 
          message: 'User tidak ditemukan di database' 
        });
      }
      
      const user = users[0];
      console.log('✅ User authenticated:', { id: user.id, name: user.name });
      
      // Token refresh mechanism
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      
      let newToken = token;
      if (timeUntilExpiry < oneHour) {
        newToken = jwt.sign(
          { 
            id: user.id,
            email: user.email 
          }, 
          config.jwtSecret, 
          {
            expiresIn: config.jwtExpire || '24h'
          }
        );
        
        const cookieOptions = getCookieOptions();
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
      
      const cookieOptions = getCookieOptions();
      delete cookieOptions.maxAge;
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
}

// Get user data from token
async function getUserData(req, res) {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token diperlukan untuk autentikasi' 
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE id = ?', 
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'User tidak ditemukan' 
      });
    }

    const user = users[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('❌ Get user data error:', error);
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Token tidak valid' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else {
      res.status(500).json({ message: 'Error mengambil data user' });
    }
  }
}

module.exports = {
  register,
  login,
  logout,
  checkAuth,
  getUserData,
  getCookieOptions
};
