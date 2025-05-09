const mysql = require('mysql2');

// Koneksi ke database MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Ganti dengan user MySQL Anda
  password: '',  // Ganti dengan password MySQL Anda
  database: 'your_database_name', // Ganti dengan nama database Anda
});

connection.connect();

// Menangani registrasi user
exports.register = (req, res) => {
  const { name, email, password, password_confirmation } = req.body;

  // Validasi password
  if (password !== password_confirmation) {
    return res.status(422).json({
      errors: {
        password_confirmation: 'Passwords do not match',
      },
    });
  }

  // Query untuk menyimpan data ke database
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  connection.query(query, [name, email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'User successfully created' });
  });
};
