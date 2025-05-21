const express = require('express');
const authController = require('../controllers/authController'); // Pastikan path benar

const router = express.Router();

// Rute untuk registrasi, login, logout, dan cek autentikasi
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
// Baris 9 yang bermasalah - perbaiki dengan memastikan fungsi checkAuth ada
router.get('/check', authController.checkAuth);
router.get('/me', authController.getUserData);

module.exports = router;
