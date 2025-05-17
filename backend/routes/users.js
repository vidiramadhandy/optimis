const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');  // Mengimpor koneksi database
const router = Router();

// Route untuk registrasi pengguna (POST /api/users)
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

        // Setelah registrasi, buat session baru dan simpan session ID di tabel sessions
        req.session.userId = result.insertId; // Menyimpan user ID dalam session
        const sessionId = req.sessionID;  // Dapatkan session ID yang dibuat oleh express-session

        // Simpan session ID dan user ID ke tabel sessions
        const insertSessionQuery = 'INSERT INTO sessions (session_id, user_id) VALUES (?, ?)';
        db.query(insertSessionQuery, [sessionId, result.insertId], (err, sessionResult) => {
          if (err) {
            console.log("Error saving session ID to sessions table:", err);
            return res.status(500).json({ error: 'Failed to store session ID' });
          }

          // Set session ID dalam cookie
          res.cookie('session_id', sessionId, { maxAge: 3600000, httpOnly: true });  // Set cookie untuk session ID

          res.status(201).json({ message: 'User successfully registered!' });
        });
      });
    });
  });
});

// Route untuk login pengguna (POST /api/login)
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

      // Cek apakah session_id sudah ada di tabel sessions
      const sessionId = req.sessionID;  // Ambil session ID
      req.session.userId = user.id;  // Menyimpan user ID dalam session

      // Simpan session ID dan user ID ke tabel sessions
      db.query('SELECT * FROM sessions WHERE session_id = ? AND user_id = ?', [sessionId, user.id], (err, sessionResult) => {
        if (err) {
          return res.status(500).json({ error: 'Database error while checking session' });
        }

        if (sessionResult.length > 0) {
          // Jika session_id sudah ada dan masih valid, gunakan session tersebut
          res.cookie('session_id', sessionId, { maxAge: 3600000, httpOnly: true });  // Set cookie untuk session ID
          res.cookie('username', user.name, { maxAge: 3600000, httpOnly: true }); // Set cookie untuk nama pengguna
          return res.status(200).json({ message: 'Login successful' });
        } else {
          // Jika session_id tidak ada atau sudah expired, buat session_id baru
          const insertSessionQuery = 'INSERT INTO sessions (session_id, user_id) VALUES (?, ?)';
          db.query(insertSessionQuery, [sessionId, user.id], (err, sessionInsertResult) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to store session ID in DB' });
            }

            res.cookie('session_id', sessionId, { maxAge: 3600000, httpOnly: true });  // Set cookie untuk session ID
            res.cookie('username', user.name, { maxAge: 3600000, httpOnly: true }); // Set cookie untuk nama pengguna
            res.status(200).json({ message: 'Login successful' });
          });
        }
      });
    });
  });
});

// Route untuk mendapatkan profil pengguna yang terautentikasi (GET /api/users/profile)
router.get('/profile', (req, res) => {
  const sessionId = req.cookies.session_id;

  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Periksa session ID di tabel sessions
  db.query('SELECT * FROM sessions WHERE session_id = ?', [sessionId], (err, sessionResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const userId = sessionResult[0].user_id; // Ambil user_id dari session
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
});

// Route untuk logout pengguna (DELETE /api/logout)
router.delete('/logout', (req, res) => {
  const sessionId = req.cookies.session_id;  // Ambil session_id dari cookie

  if (!sessionId) {
    return res.status(400).json({ error: 'No session found to logout' });
  }

  // Hapus session dari tabel sessions
  db.query('DELETE FROM sessions WHERE session_id = ?', [sessionId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete session from DB' });
    }

    // Menghapus session dan cookie session_id
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to destroy session' });
      }

      res.clearCookie('session_id');  // Menghapus session ID cookie
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
