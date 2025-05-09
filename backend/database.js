require('dotenv').config(); // Memuat variabel lingkungan dari .env
const mysql = require('mysql2');

// Membuat koneksi ke database MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,        // Host MySQL
  user: process.env.DB_USER,        // User MySQL
  password: process.env.DB_PASSWORD, // Password MySQL
  database: process.env.DB_NAME,     // Nama database yang digunakan
});

module.exports = connection;
