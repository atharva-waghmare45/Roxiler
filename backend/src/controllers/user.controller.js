const userService = require('../services/user.service');

// GET /api/user/stores
const getStores = async (req, res) => {
  try {
    const { search, sortBy, sortOrder } = req.query;
    const userId = req.user.id; // From verifyToken middleware

    const rows = await userService.listStoresForUser(userId, search, sortBy, sortOrder);

    const stores = rows.map(store => ({
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

    // Verify store exists via Service
    const storeExists = await userService.verifyStoreExists(storeId);
    if (!storeExists) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Upsert rating via Service
    const rating = await userService.upsertRating(userId, storeId, ratingValue);

    res.status(200).json({
      message: 'Rating submitted successfully!',
      rating
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
