import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  anonymous: () => api.post('/auth/anonymous'),
  getMe: () => api.get('/auth/me'),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getAuthStats: () => api.get('/auth/stats'),
};

// Scans API
export const scansAPI = {
  getAll: (params) => api.get('/scans', { params }),
  getLive: () => api.get('/scans/live'),
  getOne: (id) => api.get(`/scans/${id}`),
  create: (scanData) => api.post('/scans', scanData),
  createBatch: (scans) => api.post('/scans/batch', { scans }),
  delete: (id) => api.delete(`/scans/${id}`),
  getStats: () => api.get('/scans/stats/summary'),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

// Rewards API
export const rewardsAPI = {
  getAll: () => api.get('/rewards'),
  create: (rewardData) => api.post('/rewards', rewardData),
  update: (id, rewardData) => api.put(`/rewards/${id}`, rewardData),
  delete: (id) => api.delete(`/rewards/${id}`),
  redeem: (id) => api.post(`/rewards/redeem/${id}`),
  getRedemptions: () => api.get('/rewards/redemptions'),
  getAllRedemptions: () => api.get('/rewards/redemptions/all'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getLeaderboard: (params) => api.get('/analytics/leaderboard', { params }),
  getUserStats: () => api.get('/analytics/user-stats'),
  export: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

export default api;
