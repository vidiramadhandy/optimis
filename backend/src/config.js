require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'optipredict_secret',
  jwtExpire: '24h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'capstone',
    password: process.env.DB_PASSWORD || 'Adaptive6798',
    database: process.env.DB_NAME || 'optipredict_database'
  }
};
