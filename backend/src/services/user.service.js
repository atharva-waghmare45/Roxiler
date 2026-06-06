const { query } = require('../db');

/**
 * Retrieves stores list for users, calculating average ratings and current user's rating.
 * @param {number} userId 
 * @param {string} search 
 * @param {string} sortBy 
 * @param {string} sortOrder 
 * @returns {Promise<array>}
 */
const listStoresForUser = async (userId, search, sortBy, sortOrder) => {
  let whereClauses = [];
  let queryParams = [userId]; // $1 is active user's ID

  if (search) {
    queryParams.push(`%${search}%`);
    const searchParamIndex = queryParams.length;
    whereClauses.push(`(s.name ILIKE $${searchParamIndex} OR s.address ILIKE $${searchParamIndex})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const allowedSortFields = ['name', 'address', 'average_rating'];
  const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const activeSortOrder = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const storesQuery = `
    SELECT s.id, s.name, s.email, s.address,
           COALESCE(AVG(r.value), 0.0) as average_rating,
           (SELECT value FROM ratings WHERE store_id = s.id AND user_id = $1) as user_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    ${whereSql}
    GROUP BY s.id
    ORDER BY ${activeSortBy === 'average_rating' ? 'average_rating' : `s.${activeSortBy}`} ${activeSortOrder}
  `;

  const result = await query(storesQuery, queryParams);
  return result.rows;
};

/**
 * Verifies if a store exists.
 * @param {number} storeId 
 * @returns {Promise<boolean>}
 */
const verifyStoreExists = async (storeId) => {
  const result = await query('SELECT id FROM stores WHERE id = $1', [storeId]);
  return result.rows.length > 0;
};

/**
 * Upserts a rating for a user on a store.
 * @param {number} userId 
 * @param {number} storeId 
 * @param {number} value 
 * @returns {Promise<object>}
 */
const upsertRating = async (userId, storeId, value) => {
  const ratingUpsertQuery = `
    INSERT INTO ratings (user_id, store_id, value, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, store_id)
    DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const result = await query(ratingUpsertQuery, [userId, storeId, value]);
  return result.rows[0];
};

module.exports = {
  listStoresForUser,
  verifyStoreExists,
  upsertRating
};
