const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
require('dotenv').config();

const { validateEmail, validatePassword } = require('../utils/validators');

// POST /api/auth/signup (For NORMAL_USER registration)
const signup = async (req, res) => {
  try {
    const { name, email, address, password } = req.body;

    // Standard validations
    if (!name || name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({ message: 'Name must be between 20 and 60 characters.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' });
    }
    if (!address || address.trim().length > 400) {
      return res.status(400).json({ message: 'Address must not exceed 400 characters.' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.' });
    }

    // Check if email already exists
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user (Force role to NORMAL_USER for signup)
    await query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5)',
      [name.trim(), email.toLowerCase(), hashedPassword, address.trim(), 'NORMAL_USER']
    );

    res.status(201).json({ message: 'Registration successful! You can now log in.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Retrieve user
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/change-password (Authenticated)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: 'New password must be 8-16 characters and contain at least one uppercase letter and one special character.' });
    }

    // Retrieve user
    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentHashedPassword = result.rows[0].password;

    // Verify current password
    const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  signup,
  login,
  changePassword,
  validateEmail,
  validatePassword
};
