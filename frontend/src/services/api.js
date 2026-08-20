import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Server Wake Mechanism to prevent 502/429 storms on cold start ---
let isServerAwake = false;
let isWakingUp = false;

const ensureServerAwake = async () => {
  if (isServerAwake) return true;
  
  if (isWakingUp) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (isServerAwake) {
          clearInterval(interval);
          resolve(true);
        }
      }, 200);
    });
  }
  
  isWakingUp = true;
  try {
    let attempts = 0;
    while(attempts < 30) {
      try {
        // Add cache buster to prevent Cloudflare from returning a cached 404 and fooling the health check
        const res = await fetch(`${API_BASE_URL}?_t=${Date.now()}`, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        // If it's a 404 or any normal status, the Express server is awake!
        if (res.status !== 502 && res.status !== 503 && res.status !== 429) {
          isServerAwake = true;
          isWakingUp = false;
          return true;
        }
      } catch (err) {
        // Network error probably means CORS/502 from Render proxy
      }
      attempts++;
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch(e) {}
  
  isWakingUp = false;
  return false;
};
// -------------------------------------------------------------

api.interceptors.request.use(
  async (config) => {
    // Before sending, ensure server is awake to prevent 502/429 storms
    await ensureServerAwake();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if this is a modifying request (exclude 'post' for creates)
    const isModifyingRequest = ['put', 'delete', 'patch'].includes(config.method?.toLowerCase());
    const bypassUrls = [
      '/auth/login', 
      '/auth/refresh', 
      '/change-requests',
      '/qr-codes/generate',
      '/qr-codes/bulk/generate',
      '/qr-codes/reprint-requests',
      '/qr-codes/mark-printed',
      '/products'
    ];
    let isBypass = bypassUrls.some(url => config.url?.includes(url));

    // Bypass updates to members/applicators, but require approval for deletes
    if (config.url?.includes('/members') && config.method?.toLowerCase() !== 'delete') {
      isBypass = true;
    }
    
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) user = JSON.parse(userStr);
    } catch (e) {}

    // If it has bypass header, let it through
    if (config.headers['X-Bypass-Approval']) {
      return config;
    }

    if (isModifyingRequest && !isBypass && user && user.role === 'co-admin') {
      try {
        const result = await new Promise((resolve, reject) => {
          const event = new CustomEvent('require_change_request', {
            detail: { config, resolve, reject }
          });
          window.dispatchEvent(event);
        });

        if (result.submitted) {
          // Cancel the original request since it was converted to a change request
          return Promise.reject(new axios.Cancel('CHANGE_REQUEST_SUBMITTED'));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        return Promise.reject(new axios.Cancel('CHANGE_REQUEST_CANCELLED'));
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    
    // If Render proxy returns 502/503 (server sleeping or crashed), reset awake state
    if (error.response?.status === 502 || error.response?.status === 503 || error.message === 'Network Error') {
      isServerAwake = false;
    }

    // If the request was converted to a change request, mock a successful response
    // to prevent caller components from throwing an error and breaking the UI.
    if (axios.isCancel(error) && error.message === 'CHANGE_REQUEST_SUBMITTED') {
      return Promise.resolve({ 
        data: { 
          success: true, 
          message: 'Request submitted for approval', 
          data: null, 
          __isChangeRequest: true 
        } 
      });
    }

    if (axios.isCancel(error) && error.message === 'CHANGE_REQUEST_CANCELLED') {
      return Promise.reject(error);
    }

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
        window.dispatchEvent(new Event('auth_error'));
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just clear token if unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminAuth');
      window.dispatchEvent(new Event('auth_error'));
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
  getUsers: (onFreshData) => api.getWithCache('/auth/users', {}, onFreshData),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  updateUserPoints: (id, points, operation = 'set') => api.put(`/auth/users/${id}/points`, { points, operation }),
  resetUserPassword: (id, newPassword) => api.put(`/auth/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getAuthStats: () => api.get('/auth/stats'),
  bulkUpdatePermissions: (userIds, template) => api.post('/auth/users/bulk-permissions', { userIds, template }),
  bulkUpdate: (userIds, updates) => api.post('/auth/users/bulk-update', { userIds, updates }),
  bulkDelete: (userIds) => api.post('/auth/users/bulk-delete', { userIds }),
};

// Scans API
export const scansAPI = {
  getAll: (params, onFreshData) => api.getWithCache('/scans', { params }, onFreshData),
  getLive: (onFreshData) => api.getWithCache('/scans/live', {}, onFreshData),
  getOne: (id) => api.get(`/scans/${id}`),
  create: (scanData) => api.post('/scans', scanData),
  createBatch: (scans) => api.post('/scans/batch', { scans }),
  delete: (id) => api.delete(`/scans/${id}`),
  getStats: (params) => api.get('/scans/stats/summary', { params }),
  checkDuplicate: (params) => api.get('/scans/check-duplicate', { params }),
};

// Products API
export const productsAPI = {
  getAll: (params, onFreshData) => api.getWithCache('/products', { params }, onFreshData),
  getOne: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  syncLoyaltyStatus: () => api.post('/products/sync-loyalty-status'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params, onFreshData) => api.getWithCache('/analytics/dashboard', { params }, onFreshData),
  getLeaderboard: (params) => api.get('/analytics/leaderboard', { params }),
  getUserStats: () => api.get('/analytics/user-stats'),
  export: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
  getDailyReport: (date) => api.get('/analytics/daily-report', { params: { date } }),
  getCalendarData: (year, month) => api.get('/analytics/calendar-data', { params: { year, month } }),
  getPurchaseIntents: (onFreshData) => api.getWithCache('/analytics/purchase-intents', {}, onFreshData),
  updatePurchaseIntent: (id, data) => api.put(`/analytics/purchase-intent/${id}`, data),
  deletePurchaseIntent: (id) => api.delete(`/analytics/purchase-intent/${id}`),
  trackPageView: (data) => api.post('/analytics/track', data),
  getTrafficStats: () => api.get('/analytics/traffic-stats'),
};

// Members API (Customers & Applicators)
export const membersAPI = {
  getPublicHardwares: (onFreshData) => api.getWithCache('/members/public/hardwares', {}, onFreshData),
  getPublicApplicator: (id) => api.get(`/members/public/applicator/${id}`),
  getAll: (params, onFreshData) => api.getWithCache('/members', { params }, onFreshData),
  getOne: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  updatePoints: (id, points, operation = 'set') => api.put(`/members/${id}/points`, { points, operation }),
  getStats: () => api.get('/members/stats/summary'),
  syncFromScans: () => api.post('/members/sync-from-scans'),
  fixRoles: () => api.post('/members/fix-roles'),
  bulkDelete: (ids) => api.post('/members/bulk-delete', { ids }),
  unflag: (id) => api.put(`/members/${id}/unflag`),
};

// Loyalty Configuration API
export const loyaltyAPI = {
  getPublicConfig: (onFreshData) => api.getWithCache('/loyalty/public-config', {}, onFreshData),
  getConfig: (onFreshData) => api.getWithCache('/loyalty/config', {}, onFreshData),
  updateConfig: (config) => api.put('/loyalty/config', config),
  updateProductPoints: (productId, pointsConfig) => api.put(`/loyalty/products/${productId}/points`, pointsConfig),
};

// Cash Rewards API
export const cashRewardsAPI = {
  getMemberRewards: (memberId, params, onFreshData) => api.getWithCache(`/cash-rewards/${memberId}`, { params }, onFreshData),
  getAllRewards: (params, onFreshData) => api.getWithCache('/cash-rewards', { params }, onFreshData),
  getYtdAnalytics: (params) => api.get('/cash-rewards/ytd-analytics', { params }),
  calculateReward: (memberId, data) => api.post(`/cash-rewards/calculate/${memberId}`, data),
  requestApproval: (memberId, data) => api.put(`/cash-rewards/request-approval/${memberId}`, data),
  approveReward: (memberId, data) => api.put(`/cash-rewards/approve/${memberId}`, data),
  markAsPaid: (memberId, data) => api.post(`/cash-rewards/pay/${memberId}`, data),
  unmarkAsPaid: (memberId, data) => api.post(`/cash-rewards/unpay/${memberId}`, data),
};

// QR Codes API
export const qrCodesAPI = {
  recordScan: (scanData) => api.post('/qr-codes/record-scan', scanData),
  getScanLogs: (params) => api.get('/qr-codes/scan-logs', { params }),
  getPrintLayout: (target = 'loyalty') => api.get(`/qr-codes/settings/print-layout?target=${target}`),
  savePrintLayout: (settings) => api.put('/qr-codes/settings/print-layout', settings),
  getPrintHistory: (prefix) => api.get(`/qr-codes/batches/${prefix}/print-history`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),
};

// Rewards API
export const rewardsAPI = {
  getActive: () => api.get('/rewards'),
  getAll: () => api.get('/rewards/all'),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  delete: (id) => api.delete(`/rewards/${id}`),
};

// Redemptions API
export const redemptionsAPI = {
  getAll: () => api.get('/redemptions'),
  getForMember: (memberId) => api.get(`/redemptions/member/${memberId}`),
  requestRedemption: (data) => api.post('/redemptions', data),
  updateStatus: (id, data) => api.put(`/redemptions/${id}/status`, data),
};

export const auditLogsAPI = {
  getAll: (params, onFreshData) => api.getWithCache('/system-activity', { params }, onFreshData),
  revert: (id) => api.post(`/system-activity/${id}/revert`),
};

export const backupAPI = {
  exportData: (collections) => api.get('/backup/export', { params: collections ? { collections: collections.join(',') } : {} }),
  createLocalBackup: (collections, compression = true) => api.post('/backup/create-local', { collections, compression }),
  listBackups: () => api.get('/backup/list'),
  deleteBackup: (id) => api.delete(`/backup/local/${id}`),
  downloadBackup: (id) => api.get(`/backup/download/${id}`, { responseType: 'blob' }),
  importData: (backupData, encryptedString = null, merge = false, selectedCollections = null) => api.post('/backup/import', { backupData, encryptedString, merge, selectedCollections }),
  restoreFromServer: (id, merge = false, selectedCollections = null) => api.post(`/backup/restore-from-server/${id}`, { merge, selectedCollections }),
  getStats: () => api.get('/backup/stats'),
  listArchives: () => api.get('/backup/archives/list'),
  triggerArchive: (thresholdMonths) => api.post('/backup/archive', { thresholdMonths })
};

export const feedbackAPI = {
  create: (data) => api.post('/feedback', data),
  getAll: (onFreshData) => api.getWithCache('/feedback', {}, onFreshData),
  delete: (id) => api.delete(`/feedback/${id}`),
  getSettings: () => api.get('/feedback/settings'),
  updateSettings: (data) => api.post('/feedback/settings', data),
};

export const recycleBinAPI = {
  getAll: (onFreshData) => api.getWithCache('/recycle-bin', {}, onFreshData),
  restore: (id) => api.post(`/recycle-bin/restore/${id}`),
  delete: (id) => api.delete(`/recycle-bin/${id}`),
  empty: () => api.delete('/recycle-bin/empty'),
};

// Global cache for Stale-While-Revalidate (SWR) behavior
export const globalCache = new Map();

api.hasCache = (url, config = {}) => {
  const cacheKey = url + JSON.stringify(config.params || {});
  return globalCache.has(cacheKey);
};

api.getWithCache = async (url, config = {}, onFreshData = null) => {
  const cacheKey = url + JSON.stringify(config.params || {});
  const hasCachedData = globalCache.has(cacheKey);
  
  const fetchPromise = api.get(url, config).then(res => {
    globalCache.set(cacheKey, res);
    if (onFreshData && hasCachedData) {
      onFreshData(res);
    }
    return res;
  }).catch(err => {
    throw err;
  });

  if (hasCachedData) {
    return Promise.resolve(globalCache.get(cacheKey));
  }

  return fetchPromise;
};

export default api;
