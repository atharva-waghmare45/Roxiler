const ownerService = require('../services/owner.service');

// GET /api/owner/dashboard
const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id; // From verifyToken middleware
    const { storesSortBy, storesSortOrder, reviewsSortBy, reviewsSortOrder } = req.query;

    // Query stores metrics via Service
    const storesRows = await ownerService.getOwnerStores(ownerId, storesSortBy, storesSortOrder);

    // Query reviewers list via Service
    const reviewersRows = await ownerService.getStoreReviewers(ownerId, reviewsSortBy, reviewsSortOrder);

    // Format output
    const stores = storesRows.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      averageRating: parseFloat(parseFloat(store.average_rating).toFixed(2)),
      totalRatings: parseInt(store.rating_count, 10)
    }));

    const reviews = reviewersRows.map(review => ({
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
