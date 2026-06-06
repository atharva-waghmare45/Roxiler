const { query } = require('../db');

// GET /api/user/stores
const getStores = async (req, res) => {
  try {
    const { search, sortBy, sortOrder } = req.query;
    const userId = req.user.id; // From verifyToken middleware

    let whereClauses = [];
    let queryParams = [userId]; // $1 is always the active user's ID

    if (search) {
      queryParams.push(`%${search}%`);
      const searchParamIndex = queryParams.length;
      whereClauses.push(`(s.name ILIKE $${searchParamIndex} OR s.address ILIKE $${searchParamIndex})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortFields = ['name', 'address', 'average_rating'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const activeSortOrder = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Query stores, calculating average ratings and retrieving current user's rating
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

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      rating: parseFloat(parseFloat(store.average_rating).toFixed(2)),
      userRating: store.user_rating ? parseInt(store.user_rating, 10) : null
    }));

    res.json(stores);
  } catch (error) {
    console.error('User getStores error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/user/ratings
const submitRating = async (req, res) => {
  try {
    const { storeId, value } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    // Validate inputs
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required.' });
    }

    const ratingValue = parseInt(value, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'Rating value must be an integer between 1 and 5.' });
    }

    // Verify store exists
    const storeCheck = await query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Upsert rating (insert or update on duplicate key)
    const ratingUpsertQuery = `
      INSERT INTO ratings (user_id, store_id, value, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, store_id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(ratingUpsertQuery, [userId, storeId, ratingValue]);

    res.status(200).json({
      message: 'Rating submitted successfully!',
      rating: result.rows[0]
    });
  } catch (error) {
    console.error('User submitRating error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getStores,
  submitRating
};
