const express = require('express');
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../utils/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;