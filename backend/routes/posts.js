const { Router } = require('express');
const db = require('../database');  // Mengimpor koneksi database

const router = Router();

// Route untuk mengambil semua postingan (GET /posts)
router.get('/', (req, res) => {
    const query = 'SELECT * FROM posts';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);  // Mengirimkan hasil query sebagai respons
    });
});

// Export router yang benar
module.exports = router;
