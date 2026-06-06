const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { validateEmail, validatePassword } = require('../utils/validators');

// Helper to check valid roles
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

    // Check if email already exists
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
      [name.trim(), email.toLowerCase(), hashedPassword, address.trim(), role]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: result.rows[0]
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

    // Verify owner exists and is a STORE_OWNER
    const ownerCheck = await query('SELECT role FROM users WHERE id = $1', [ownerId]);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Assigned owner does not exist.' });
    }
    if (ownerCheck.rows[0].role !== 'STORE_OWNER') {
      return res.status(400).json({ message: 'Assigned owner must have the STORE_OWNER role.' });
    }

    // Insert store
    const result = await query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), email.toLowerCase(), address.trim(), ownerId]
    );

    res.status(201).json({
      message: 'Store registered successfully.',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Admin createStore error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/dashboard (Counts)
const getDashboardStats = async (req, res) => {
  try {
    const userCount = await query('SELECT COUNT(*) FROM users');
    const storeCount = await query('SELECT COUNT(*) FROM stores');
    const ratingCount = await query('SELECT COUNT(*) FROM ratings');

    res.json({
      totalUsers: parseInt(userCount.rows[0].count, 10),
      totalStores: parseInt(storeCount.rows[0].count, 10),
      totalRatings: parseInt(ratingCount.rows[0].count, 10)
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role, sortBy, sortOrder } = req.query;

    // Build filter query
    let whereClauses = [];
    let queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchParamIndex = queryParams.length;
      whereClauses.push(`(u.name ILIKE $${searchParamIndex} OR u.email ILIKE $${searchParamIndex} OR u.address ILIKE $${searchParamIndex})`);
    }

    if (role) {
      queryParams.push(role);
      const roleParamIndex = queryParams.length;
      whereClauses.push(`u.role = $${roleParamIndex}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Build sorting (restrict parameters to prevent SQL injection)
    const allowedSortFields = ['name', 'email', 'address', 'role', 'created_at'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const activeSortOrder = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Query retrieving users. If store owner, calculate average rating of all owned stores.
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
             (SELECT COALESCE(AVG(r.value), 0.0)
              FROM stores s
              LEFT JOIN ratings r ON s.id = r.store_id
              WHERE s.owner_id = u.id) as average_rating
      FROM users u
      ${whereSql}
      ORDER BY u.${activeSortBy} ${activeSortOrder}
    `;

    const result = await query(usersQuery, queryParams);

    // Format output: Only display rating if the user is a STORE_OWNER
    const users = result.rows.map(user => {
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

    let whereClauses = [];
    let queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchParamIndex = queryParams.length;
      whereClauses.push(`(s.name ILIKE $${searchParamIndex} OR s.address ILIKE $${searchParamIndex})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Allowed sort fields (average_rating is aliased and calculated)
    const allowedSortFields = ['name', 'email', 'address', 'average_rating'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const activeSortOrder = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const storesQuery = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id,
             COALESCE(AVG(r.value), 0.0) as average_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereSql}
      GROUP BY s.id
      ORDER BY ${activeSortBy === 'average_rating' ? 'average_rating' : `s.${activeSortBy}`} ${activeSortOrder}
    `;

    const result = await query(storesQuery, queryParams);

    const stores = result.rows.map(store => ({
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
