const db = require('../models');
const User = db.User;

const checkDuplicatenameOrEmail = async (req, res, next) => {
  try {
    // Cek name
    const nameExists = await User.findOne({
      where: { name: req.body.name }
    });
    
    if (nameExists) {
      return res.status(400).json({
        message: 'name sudah digunakan!'
      });
    }

    // Cek email
    const emailExists = await User.findOne({
      where: { email: req.body.email }
    });
    
    if (emailExists) {
      return res.status(400).json({
        message: 'Email sudah digunakan!'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan saat memvalidasi data!',
      error: error.message
    });
  }
};

module.exports = { checkDuplicatenameOrEmail };
