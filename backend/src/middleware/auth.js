const jwt = require('jsonwebtoken');
const config = require('../config');  // Pastikan jwtSecret konsisten dengan yang ada di config

// Middleware untuk memverifikasi token
function verifyToken(req, res, next) {
  const token = req.cookies.token || req.headers['x-access-token'];  // Token bisa ada di cookie atau header

  if (!token) {
    return res.status(403).json({ message: 'Token diperlukan untuk autentikasi' });  // Token tidak ada
  }

  try {
    // Verifikasi token menggunakan JWT Secret yang sama
    const decoded = jwt.verify(token, config.jwtSecret);  // Pastikan jwtSecret konsisten
    req.userId = decoded.id;  // Menyimpan userId yang didekodekan ke dalam request untuk digunakan di controller
    next();  // Melanjutkan ke route berikutnya (controller)
  } catch (error) {
    console.error('Token tidak valid:', error);
    return res.status(401).json({ message: 'Token tidak valid' });  // Token tidak valid
  }
}

module.exports = {
  verifyToken,
};
