import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('urbanpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('urbanpulse_token');
        localStorage.removeItem('urbanpulse_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const reportsApi = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  updateStatus: (id, data) => api.patch(`/reports/${id}/status`, data),
  getHistory: (id) => api.get(`/reports/${id}/history`),
  uploadImage: (formData) => api.post('/reports/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const predictApi = {
  predict: (features) => api.post('/predict', features),
};

export const analyticsApi = {
  getTrends: () => api.get('/analytics/trends'),
  getKPIs: () => api.get('/analytics/kpis'),
};

export const alertsApi = {
  getAll: (params) => api.get('/alerts', { params }),
  markRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.post('/alerts/read-all'),
};

export const mlApi = {
  getPerformance: () => api.get('/ml/performance'),
};

export default api;
