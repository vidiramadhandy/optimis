const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');  // Mengimpor koneksi database
const authenticateToken = require('../middleware/auth');  // Middleware untuk autentikasi menggunakan JWT

const router = Router();

// Middleware untuk logging request yang masuk
router.use((req, res, next) => {
    console.log('Request made to /USERS ROUTE');
    next();  // Pastikan `next()` dipanggil untuk melanjutkan eksekusi
});

// Route untuk registrasi pengguna (POST /users)
router.post('/', async (req, res) => {
    const { name, email, password, password_confirmation } = req.body;

    // Validasi jika password dan password_confirmation tidak cocok
    if (password !== password_confirmation) {
        return res.status(422).json({ error: 'Passwords do not match' });
    }

    // Cek jika email sudah terdaftar
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Enkripsi password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Password hashing error' });
            }

            // Simpan pengguna ke database
            const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
            db.query(query, [name, email, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Database insertion error' });
                }
                res.status(201).json({ message: 'User successfully registered!' });
            });
        });
    });
});

// Route untuk login pengguna (POST /users/login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Cek apakah email ada di database
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Email or password is incorrect' });
        }

        // Verifikasi password
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Password comparison error' });
            }
            if (!isMatch) {
                return res.status(400).json({ error: 'Email or password is incorrect' });
            }

            // Buat JWT token
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        });
    });
});

// Route untuk mendapatkan profil pengguna yang terautentikasi (GET /users/profile)
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;  // Diambil dari JWT token
    db.query('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);  // Mengirimkan data profil pengguna
    });
});

// Export router yang benar
module.exports = router;
