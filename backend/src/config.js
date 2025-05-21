require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'optipredict_secret',
  jwtExpire: '24h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'optipredict_database'
  }
};
