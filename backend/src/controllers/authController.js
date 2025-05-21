const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');  // Pastikan db Anda terhubung dengan benar
const config = require('../config');  // Pastikan Anda memiliki config yang benar untuk JWT secret dan expire time

// Register user
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    // Cek apakah email sudah digunakan
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Simpan user baru
    await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat registrasi' });
  }
}

// Login user
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Cari user berdasarkan email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    const user = users[0];
    
    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    // Buat token
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpire
    });
    
    // Simpan token di cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 hari
    });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat login' });
  }
}

// Logout user
function logout(req, res) {
  res.clearCookie('token');  // Menghapus token dari cookie
  res.json({ message: 'Logout berhasil' });
}

// Cek status autentikasi
function checkAuth(req, res) {
  const token = req.cookies.token || req.headers['x-access-token'];
  
  if (!token) {
    return res.json({ isAuthenticated: false });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret); // Gunakan JWT Secret yang sama dengan frontend
    res.json({ isAuthenticated: true, userId: decoded.id });
  } catch (error) {
    res.json({ isAuthenticated: false });
  }
}

// Endpoint untuk mendapatkan profil pengguna
async function getProfile(req, res) {
  const token = req.cookies.token || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    // Memverifikasi token menggunakan jwtSecret yang sama dengan frontend
    const decoded = jwt.verify(token, config.jwtSecret); // Verifikasi token menggunakan jwtSecret dari config.js
    
    // Mengambil data pengguna berdasarkan id yang ada di token
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user[0]); // Mengirimkan data pengguna
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(403).json({ message: 'Token tidak valid atau telah kedaluwarsa' });
  }
}

module.exports = {
  register,
  login,
  logout,
  checkAuth,
  getProfile  // Menambahkan endpoint untuk mendapatkan data profil pengguna
};
