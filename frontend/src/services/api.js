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
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Try to refresh the token
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          // Update tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('adminAuth');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just clear token if unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminAuth');
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
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  updateUserPoints: (id, points, operation = 'set') => api.put(`/auth/users/${id}/points`, { points, operation }),
  resetUserPassword: (id, newPassword) => api.put(`/auth/users/${id}/reset-password`, { newPassword }),
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

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getLeaderboard: (params) => api.get('/analytics/leaderboard', { params }),
  getUserStats: () => api.get('/analytics/user-stats'),
  export: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

// Members API (Customers & Applicators)
export const membersAPI = {
  getAll: (params) => api.get('/members', { params }),
  getOne: (id) => api.get(`/members/${id}`),
  updatePoints: (id, points, operation = 'set') => api.put(`/members/${id}/points`, { points, operation }),
  getStats: () => api.get('/members/stats/summary'),
  syncFromScans: () => api.post('/members/sync-from-scans'),
};

// Loyalty Configuration API
export const loyaltyAPI = {
  getConfig: () => api.get('/loyalty/config'),
  updateConfig: (config) => api.put('/loyalty/config', config),
  updateProductPoints: (productId, pointsConfig) => api.put(`/loyalty/products/${productId}/points`, pointsConfig),
};

// Cash Rewards API
export const cashRewardsAPI = {
  getMemberRewards: (memberId, params) => api.get(`/cash-rewards/${memberId}`, { params }),
  getAllRewards: (params) => api.get('/cash-rewards', { params }),
  calculateReward: (memberId, data) => api.post(`/cash-rewards/calculate/${memberId}`, data),
  markAsPaid: (memberId, data) => api.put(`/cash-rewards/mark-paid/${memberId}`, data),
};

export default api;
