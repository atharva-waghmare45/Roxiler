const { query } = require('../db');

/**
 * Finds a user by email.
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Registers a new user.
 * @param {string} name 
 * @param {string} email 
 * @param {string} hashedPassword 
 * @param {string} address 
 * @param {string} role 
 * @returns {Promise<object>}
 */
const createUser = async (name, email, hashedPassword, address, role) => {
  const result = await query(
    'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
    [name.trim(), email.toLowerCase(), hashedPassword, address.trim(), role]
  );
  return result.rows[0];
};

/**
 * Finds a user by ID.
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
const findUserById = async (id) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Updates a user's password.
 * @param {number} id 
 * @param {string} hashedPassword 
 * @returns {Promise<void>}
 */
const updatePassword = async (id, hashedPassword) => {
  await query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, id]
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updatePassword
};
