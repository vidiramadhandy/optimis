// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyToken(req, res, next) {
  // Cek token dari berbagai sumber
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.split(' ')[1] : 
                req.cookies.token || 
                req.headers['x-access-token'];
  
  if (!token) {
    return res.status(403).json({ message: 'Token diperlukan untuk autentikasi' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

module.exports = {
  verifyToken
};
