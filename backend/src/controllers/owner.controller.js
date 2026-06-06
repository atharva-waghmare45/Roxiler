const { query } = require('../db');

// GET /api/owner/dashboard
const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id; // From verifyToken middleware

    // Query stores owned by the owner, including overall average rating and rating count
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
    const storesResult = await query(storesQuery, [ownerId]);

    // Query list of users who rated their stores
    const reviewersQuery = `
      SELECT u.name as user_name, u.email as user_email, u.address as user_address,
             r.value as rating_value, r.created_at as rated_at, s.name as store_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN stores s ON r.store_id = s.id
      WHERE s.owner_id = $1
      ORDER BY r.created_at DESC
    `;
    const reviewersResult = await query(reviewersQuery, [ownerId]);

    // Format output
    const stores = storesResult.rows.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      averageRating: parseFloat(parseFloat(store.average_rating).toFixed(2)),
      totalRatings: parseInt(store.rating_count, 10)
    }));

    const reviews = reviewersResult.rows.map(review => ({
      userName: review.user_name,
      userEmail: review.user_email,
      userAddress: review.user_address,
      ratingValue: parseInt(review.rating_value, 10),
      storeName: review.store_name,
      ratedAt: review.rated_at
    }));

    res.json({
      stores,
      reviews
    });
  } catch (error) {
    console.error('Owner getDashboard error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getDashboard
};
