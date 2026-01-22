import axios from 'axios';

// In Codespaces, we need to use the full URL since proxy may not work correctly
const getBaseURL = () => {
  // If running in Codespaces or with forwarded ports, use environment variable or fallback
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Check if we're in a Codespaces environment
  if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    // Use the same origin but with port 5000
    const hostname = window.location.hostname.replace('-3000.', '-5000.').replace('-3001.', '-5000.');
    return `https://${hostname}/api`;
  }
  // Default for local development with proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: always get latest token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Helper Functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  deleteMultiple: (ids) => api.delete('/transactions', { data: { ids } }),
  getStats: (params) => api.get('/transactions/stats/summary', { params })
};

export const uploadAPI = {
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getTemplate: () => api.get('/upload/template', { responseType: 'blob' }),
  clearImported: () => api.delete('/upload/clear-imported')
};

export const analysisAPI = {
  getSpendingAnalysis: (data) => api.post('/analysis/spending', data),
  getBudgetSuggestions: () => api.post('/analysis/budget-suggestions'),
  getSavingsTips: () => api.post('/analysis/savings-tips'),
  chat: (message, context) => api.post('/analysis/chat', { message, context }),
  getHistory: (params) => api.get('/analysis/history', { params })
};

export const dashboardAPI = {
  getSummary: (period) => api.get('/dashboard/summary', { params: { period } }),
  getCategoryBreakdown: (period) => api.get('/dashboard/category-breakdown', { params: { period } }),
  getMonthlyTrend: (months) => api.get('/dashboard/monthly-trend', { params: { months } }),
  getRecentTransactions: (limit) => api.get('/dashboard/recent-transactions', { params: { limit } }),
  getBudgetStatus: () => api.get('/dashboard/budget-status'),
  saveBudget: (data) => api.post('/dashboard/budgets', data),
  deleteBudget: (category) => api.delete(`/dashboard/budgets/${encodeURIComponent(category)}`)
};
