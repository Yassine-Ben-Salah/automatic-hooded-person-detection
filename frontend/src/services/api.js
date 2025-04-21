import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const MODEL_URL = process.env.REACT_APP_MODEL_URL || 'http://localhost:5000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetData) => api.post('/auth/reset-password', resetData)
};

// User API (admin only)
export const userAPI = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Detection API
export const detectionAPI = {
  getDetections: (params) => api.get('/detections', { params }),
  getDetection: (id) => api.get(`/detections/${id}`),
  updateDetection: (id, data) => api.put(`/detections/${id}`, data),
  deleteDetection: (id) => api.delete(`/detections/${id}`),
  getStats: (timeRange) => api.get(`/detections/stats?timeRange=${timeRange}`),
  getLabels: () => api.get('/detections/labels'),
  getDetectionsByCamera: (cameraId, params) => api.get(`/cameras/${cameraId}/detections`, { params }),
  captureDetection: () => api.post('/detections/capture')
};

// Model API
export const modelAPI = {
  getVideoFeed: () => `${MODEL_URL}/video_feed`,
  getDetections: () => axios.get(`${MODEL_URL}/detections`),
  getModel: () => api.get('/models/current'),
  updateModelConfig: (config) => api.put('/models/current/config', config),
  deployModel: (deployData) => api.post('/models/deploy', deployData),
  trainModel: (trainingData) => api.post('/models/train', trainingData),
  uploadModel: (formData, config) => api.post('/models/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }),
  getDeploymentHistory: () => api.get('/models/deployments'),
  getModelMetrics: () => api.get('/models/metrics'),
  getTrainingStatus: () => api.get('/models/train/status'),
  getTrainingLogs: () => api.get('/models/train/logs')
};

export default api; 