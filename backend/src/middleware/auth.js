// backend/src/middleware/auth.js - KODE LENGKAP DIPERBAIKI
const jwt = require('jsonwebtoken');
const config = require('../config');

const verifyToken = (req, res, next) => {
  try {
    // Cek token dari berbagai sumber
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('🔍 Token verification for:', req.path);
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found for protected route');
      return res.status(401).json({ 
        success: false,
        authenticated: false, 
        message: 'Token tidak ditemukan - akses ditolak' 
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('✅ Token verified for user:', decoded.id);
      req.userId = decoded.id;
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        authenticated: false, 
        message: 'Token tidak valid atau expired' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error in token verification:', error);
    res.status(500).json({ 
      success: false,
      authenticated: false, 
      message: 'Error internal server dalam verifikasi token' 
    });
  }
};

module.exports = { verifyToken };
