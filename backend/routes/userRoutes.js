const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rute untuk registrasi user
router.post('/register', userController.register);

module.exports = router;
