const { query } = require('../db');

/**
 * Retrieves stores metrics owned by the store owner.
 * @param {number} ownerId 
 * @returns {Promise<array>}
 */
const getOwnerStores = async (ownerId) => {
  const storesQuery = `
    SELECT s.id, s.name, s.email, s.address,
           COALESCE(AVG(r.value), 0.0) as average_rating,
           COUNT(r.id) as rating_count
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.owner_id = $1
    GROUP BY s.id
    ORDER BY s.name ASC
  `;
  const result = await query(storesQuery, [ownerId]);
  return result.rows;
};

/**
 * Retrieves the reviewers list for stores owned by the store owner.
 * @param {number} ownerId 
 * @returns {Promise<array>}
 */
const getStoreReviewers = async (ownerId) => {
  const reviewersQuery = `
    SELECT u.name as user_name, u.email as user_email, u.address as user_address,
           r.value as rating_value, r.created_at as rated_at, s.name as store_name
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    WHERE s.owner_id = $1
    ORDER BY r.created_at DESC
  `;
  const result = await query(reviewersQuery, [ownerId]);
  return result.rows;
};

module.exports = {
  getOwnerStores,
  getStoreReviewers
};
