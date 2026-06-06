import client from './client';

/**
 * Fetch store owner dashboard data (owned stores and customer reviews).
 * Supports sorting parameters: storesSortBy, storesSortOrder, reviewsSortBy, reviewsSortOrder.
 * @param {object} params 
 * @returns {Promise<object>} { stores: Array, reviews: Array }
 */
export const getOwnerDashboard = async (params = {}) => {
  const response = await client.get('/owner/dashboard', { params });
  return response.data;
};
