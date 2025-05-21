// File: backend/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Semua rute memerlukan autentikasi
router.use(verifyToken);

// Route untuk mengambil data profil pengguna
router.get('/profile', userController.getProfile);

// Route untuk memperbarui data profil pengguna
router.put('/profile', userController.updateProfile);

module.exports = router;
