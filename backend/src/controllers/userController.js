// File: backend/src/controllers/userController.js
const db = require('../db');

async function getProfile(req, res) {
  try {
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [req.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error mengambil profil pengguna' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    
    await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.userId]);
    
    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error memperbarui profil pengguna' });
  }
}

// PENTING: Pastikan ekspor dilakukan dengan benar
module.exports = {
  getProfile,
  updateProfile
};
