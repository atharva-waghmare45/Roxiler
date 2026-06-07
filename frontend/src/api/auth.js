import client from './client';

export const loginUser = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data; // { token, user }
};

export const signupUser = async (name, email, address, password) => {
  const response = await client.post('/auth/signup', { name, email, address, password });
  return response.data; // { message }
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await client.post('/auth/change-password', { oldPassword, newPassword });
  return response.data; // { message }
};

export const verifyEmail = async (email) => {
  const response = await client.post('/auth/verify-email', { email });
  return response.data; // { message, success }
};

export const resetPasswordDirect = async (email, newPassword) => {
  const response = await client.post('/auth/reset-password-direct', { email, newPassword });
  return response.data; // { message }
};
