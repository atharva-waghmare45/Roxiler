const bcrypt = require('bcryptjs');
const { validateEmail, validatePassword } = require('../utils/validators');
const adminService = require('../services/admin.service');
const authService = require('../services/auth.service');

const ALLOWED_ROLES = ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'];

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;

    // Field Validations
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
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}` });
    }

    // Check if email already exists via Auth Service
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user via Auth Service
    const newUser = await authService.createUser(name, email, hashedPassword, address, role);

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Admin createUser error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/admin/stores
const createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Store name is required.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid store email format.' });
    }
    if (!address || address.trim().length > 400) {
      return res.status(400).json({ message: 'Address is required and must not exceed 400 characters.' });
    }
    if (!ownerId) {
      return res.status(400).json({ message: 'Owner ID is required.' });
    }

    // Verify owner exists and is a STORE_OWNER via Admin Service
    const owner = await adminService.verifyOwner(ownerId);
    if (!owner) {
      return res.status(400).json({ message: 'Assigned owner does not exist.' });
    }
    if (owner.role !== 'STORE_OWNER') {
      return res.status(400).json({ message: 'Assigned owner must have the STORE_OWNER role.' });
    }

    // Insert store via Admin Service
    const store = await adminService.createStore(name, email, address, ownerId);

    res.status(201).json({
      message: 'Store registered successfully.',
      store
    });
  } catch (error) {
    console.error('Admin createStore error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role, sortBy, sortOrder } = req.query;

    const rows = await adminService.listUsers(search, role, sortBy, sortOrder);

    // Format output
    const users = rows.map(user => {
      const formatted = {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.created_at
      };
      if (user.role === 'STORE_OWNER') {
        formatted.rating = parseFloat(parseFloat(user.average_rating).toFixed(2));
      }
      return formatted;
    });

    res.json(users);
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/stores
const getStores = async (req, res) => {
  try {
    const { search, sortBy, sortOrder } = req.query;

    const rows = await adminService.listStores(search, sortBy, sortOrder);

    const stores = rows.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      ownerId: store.owner_id,
      rating: parseFloat(parseFloat(store.average_rating).toFixed(2))
    }));

    res.json(stores);
  } catch (error) {
    console.error('Admin getStores error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createUser,
  createStore,
  getDashboardStats,
  getUsers,
  getStores
};
