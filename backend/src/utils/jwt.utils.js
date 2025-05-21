const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

// Generate access token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.secret,
    { expiresIn: '24h' } // Token berlaku selama 24 jam
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.refreshTokenSecret,
    { expiresIn: '7d' } // Refresh token berlaku selama 7 hari
  );
};

module.exports = {
  generateToken,
  generateRefreshToken
};
