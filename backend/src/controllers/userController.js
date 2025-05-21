const db = require('../db');

// Ambil profil user
async function getProfile(req, res) {
  try {
    const userId = req.userId;
    
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil profil' });
  }
}

// Update profil user
async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { name, email } = req.body;
    
    await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );
    
    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui profil' });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
