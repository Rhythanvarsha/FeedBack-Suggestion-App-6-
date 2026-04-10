import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auth Services
export const authService = {
  register: (name, email, password, role = 'USER', category = null) =>
    api.post('/auth/register', { name, email, password, role, category }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getProfile: () =>
    api.get('/auth/profile'),
};

// Feedback Services
export const feedbackService = {
  submitFeedback: (title, description, category, rating, userId, username) =>
    api.post('/feedback/submit', { title, description, category, rating, userId, username }),
  
  editFeedback: (id, title, description, category, rating) =>
    api.put(`/feedback/${id}/edit`, { title, description, category, rating }),
  
  deleteFeedback: (id) =>
    api.delete(`/feedback/${id}`),
  
  getMyFeedback: (page = 0, size = 10, sortBy = 'createdDate') =>
    api.get('/feedback/my-feedback', { params: { page, size, sortBy } }),

  searchMyFeedback: (title, page = 0, size = 10, sortBy = 'createdDate') =>
    api.get('/feedback/my-feedback/search', { params: { title, page, size, sortBy } }),
  
  getFeedbackById: (id) =>
    api.get(`/feedback/${id}`),
  
  getFeedbackByCategory: (category, page = 0, size = 10) =>
    api.get(`/feedback/category/${category}`, { params: { page, size } }),
  
  searchFeedback: (title, page = 0, size = 10) =>
    api.get('/feedback/search', { params: { title, page, size } }),
  
  getUserDashboardStats: () =>
    api.get('/feedback/user/stats'),
};

// Admin Services
export const adminService = {
  getAllFeedback: (page = 0, size = 10, sortBy = 'createdDate') =>
    api.get('/admin/feedback', { params: { page, size, sortBy } }),
  
  getFeedbackByCategory: (category, page = 0, size = 10) =>
    api.get(`/admin/feedback/category/${category}`, { params: { page, size } }),
  
  getFeedbackByStatus: (status, page = 0, size = 10) =>
    api.get(`/admin/feedback/status/${status}`, { params: { page, size } }),
  
  searchFeedback: (title, page = 0, size = 10) =>
    api.get('/admin/feedback/search', { params: { title, page, size } }),
  
  updateFeedbackStatus: (id, status) =>
    api.put(`/admin/feedback/${id}/status`, { status }),
  
  addReplyToFeedback: (id, reply) =>
    api.put(`/admin/feedback/${id}/reply`, { reply }),
  
  deleteFeedback: (id) =>
    api.delete(`/admin/feedback/${id}`),
  
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),

  exportFeedbackCsv: (status = null, title = null) =>
    api.get('/admin/feedback/export', {
      params: { status, title },
      responseType: 'blob',
    }),

  bulkUpdateFeedbackStatus: (ids, status) =>
    api.put('/admin/feedback/bulk/status', { ids, status }),
};

export const healthService = {
  getHealth: () => api.get('/health'),
};

// Notification Services
export const notificationService = {
  getMyNotifications: (limit = 20) => api.get('/notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
