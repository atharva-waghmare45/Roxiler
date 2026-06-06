import client from './client';

export const listStores = async (params = {}) => {
  const response = await client.get('/user/stores', { params });
  return response.data; // Array of stores with rating and userRating
};

export const submitStoreRating = async (storeId, value) => {
  const response = await client.post('/user/ratings', { storeId, value });
  return response.data; // { message, rating }
};
