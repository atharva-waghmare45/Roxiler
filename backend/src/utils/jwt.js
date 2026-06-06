const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_testing_only';

/**
 * Generates a signed JSON Web Token (JWT) with user data.
 * @param {object} payload - The data to sign into the JWT (e.g., { id, role })
 * @returns {string} The signed JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verifies a given JSON Web Token (JWT) and decodes its payload.
 * @param {string} token - The token to verify
 * @returns {object} The decoded token payload if valid
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
