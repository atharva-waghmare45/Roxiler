const { validateEmail, validatePassword } = require('../utils/validators');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const authService = require('../services/auth.service');

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

    // Check if email already exists via Service
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user via Service
    await authService.createUser(name, email, hashedPassword, address, 'NORMAL_USER');

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

    // Retrieve user via Service
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = generateToken({ id: user.id, role: user.role });

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

    // Retrieve user via Service
    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentHashedPassword = user.password;

    // Verify current password
    const isMatch = await comparePassword(oldPassword, currentHashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash new password and update via Service
    const hashedNewPassword = await hashPassword(newPassword);
    await authService.updatePassword(userId, hashedNewPassword);

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/verify-email (Forgot Password Step 1)
const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    res.json({ message: 'Email verified successfully.', success: true });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/reset-password-direct (Forgot Password Step 2)
const resetPasswordDirect = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: 'New password must be 8-16 characters and contain at least one uppercase letter and one special character.' });
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await authService.updatePassword(user.id, hashedNewPassword);

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  signup,
  login,
  changePassword,
  verifyEmail,
  resetPasswordDirect,
  validateEmail,
  validatePassword
};
