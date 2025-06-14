require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'optipredict_secret',
  jwtExpire: '24h',
  db: {
    host: process.env.DB_HOST || 'optipredict-server.mysql.database.azure.com',
    user: process.env.DB_USER || 'admin123@optipredict-server',
    password: process.env.DB_PASSWORD || 'adaptive11!',
    database: process.env.DB_NAME || 'optipredict_database'
  }
};
