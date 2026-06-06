import client from './client';

export const getDashboardStats = async () => {
  const response = await client.get('/admin/dashboard');
  return response.data; // { totalUsers, totalStores, totalRatings }
};

export const listUsers = async (params = {}) => {
  const response = await client.get('/admin/users', { params });
  return response.data; // Array of users
};

export const listStores = async (params = {}) => {
  const response = await client.get('/admin/stores', { params });
  return response.data; // Array of stores
};

export const createUser = async (userData) => {
  const response = await client.post('/admin/users', userData);
  return response.data; // { message, user }
};

export const createStore = async (storeData) => {
  const response = await client.post('/admin/stores', storeData);
  return response.data; // { message, store }
};
