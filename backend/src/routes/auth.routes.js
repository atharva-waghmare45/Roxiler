const express = require('express');
const { signup, login, changePassword, verifyEmail, resetPasswordDirect } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Public auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/reset-password-direct', resetPasswordDirect);

// Authenticated auth routes
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
