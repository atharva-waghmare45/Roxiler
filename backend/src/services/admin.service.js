const { query } = require('../db');

/**
 * Retrieves aggregate metrics counts.
 * @returns {Promise<object>}
 */
const getStats = async () => {
  const userCount = await query('SELECT COUNT(*) FROM users');
  const storeCount = await query('SELECT COUNT(*) FROM stores');
  const ratingCount = await query('SELECT COUNT(*) FROM ratings');

  return {
    totalUsers: parseInt(userCount.rows[0].count, 10),
    totalStores: parseInt(storeCount.rows[0].count, 10),
    totalRatings: parseInt(ratingCount.rows[0].count, 10)
  };
};

/**
 * Checks if a user is a valid store owner.
 * @param {number} ownerId 
 * @returns {Promise<object|null>}
 */
const verifyOwner = async (ownerId) => {
  const result = await query('SELECT role FROM users WHERE id = $1', [ownerId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Registers a new store.
 * @param {string} name 
 * @param {string} email 
 * @param {string} address 
 * @param {number} ownerId 
 * @returns {Promise<object>}
 */
const createStore = async (name, email, address, ownerId) => {
  const result = await query(
    'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name.trim(), email.toLowerCase(), address.trim(), ownerId]
  );
  return result.rows[0];
};

/**
 * Retrieves lists of users with sorting, role filtering, and owner ratings.
 * @param {string} search 
 * @param {string} role 
 * @param {string} sortBy 
 * @param {string} sortOrder 
 * @returns {Promise<array>}
 */
const listUsers = async (search, role, sortBy, sortOrder) => {
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

  const allowedSortFields = ['name', 'email', 'address', 'role', 'created_at'];
  const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const activeSortOrder = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

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
  return result.rows;
};

/**
 * Retrieves list of stores with overall average ratings.
 * @param {string} search 
 * @param {string} sortBy 
 * @param {string} sortOrder 
 * @returns {Promise<array>}
 */
const listStores = async (search, sortBy, sortOrder) => {
  let whereClauses = [];
  let queryParams = [];

  if (search) {
    queryParams.push(`%${search}%`);
    const searchParamIndex = queryParams.length;
    whereClauses.push(`(s.name ILIKE $${searchParamIndex} OR s.address ILIKE $${searchParamIndex})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
  return result.rows;
};

module.exports = {
  getStats,
  verifyOwner,
  createStore,
  listUsers,
  listStores
};
