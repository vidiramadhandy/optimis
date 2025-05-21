const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');

// Register user
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    // Check if the email is already in use
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already taken' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during registration' });
  }
}

// Login user
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Create token
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpire || '24h'
    });
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during login' });
  }
}

// Logout user
function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

// Check authentication status - TAMBAHKAN FUNGSI INI
async function checkAuth(req, res) {
  try {
    const token = req.cookies.token || req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({ authenticated: false, message: 'Tidak terautentikasi' });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Cek apakah user masih ada di database
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ authenticated: false, message: 'User tidak ditemukan' });
    }
    
    // Jika token valid, kirim status autentikasi
    res.json({ authenticated: true, userId: decoded.id });
  } catch (error) {
    console.error(error);
    res.status(401).json({ authenticated: false, message: 'Token tidak valid' });
  }
}

// Get user data from token
async function getUserData(req, res) {
  try {
    const token = req.cookies.token || req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({ message: 'Token is required for authentication' });
    }

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user data based on the decoded ID
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Send user data
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
}

// PENTING: Ekspor semua fungsi yang digunakan di routes
module.exports = {
  register,
  login,
  logout,
  checkAuth, // Pastikan fungsi ini diekspor
  getUserData,
};
