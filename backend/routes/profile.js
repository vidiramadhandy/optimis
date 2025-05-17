// Route untuk mendapatkan profil pengguna yang terautentikasi (GET /api/users/profile)
router.get('/profile', (req, res) => {
  const sessionId = req.cookies.session_id;  // Ambil session_id dari cookie

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

    const userId = sessionResult[0].user_id;  // Ambil user_id dari session
    db.query('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: `Welcome, ${results[0].name}`, user: results[0] });  // Kirim data profil pengguna
    });
  });
});
