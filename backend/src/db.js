const mysql = require('mysql2/promise');
const config = require('./config');

// Buat pool koneksi dengan konfigurasi SSL untuk Azure
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  ssl: config.db.ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: config.db.acquireTimeout,
  timeout: config.db.timeout,
  reconnect: true
});

// Tes koneksi dengan error handling yang lebih detail
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Koneksi database OptiPredict berhasil!');
    console.log('Host:', config.db.host);
    console.log('Database:', config.db.database);
    
    // Test query sederhana
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Test query berhasil:', rows);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Koneksi database OptiPredict gagal:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
}

// Fungsi untuk membuat tabel jika belum ada
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Contoh pembuatan tabel untuk aplikasi machine learning
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        input_data JSON,
        prediction_result JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database OptiPredict berhasil diinisialisasi!');
    connection.release();
  } catch (error) {
    console.error('Gagal menginisialisasi database:', error);
  }
}

// Jalankan tes koneksi dan inisialisasi
testConnection().then(success => {
  if (success) {
    initializeDatabase();
  }
});

module.exports = pool;
