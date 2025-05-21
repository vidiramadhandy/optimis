const mysql = require('mysql2/promise');
const config = require('./config');

// Buat pool koneksi
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Koneksi database OptiPredict berhasil!');
    connection.release();
  } catch (error) {
    console.error('Koneksi database OptiPredict gagal:', error);
  }
}

testConnection();

module.exports = pool;
