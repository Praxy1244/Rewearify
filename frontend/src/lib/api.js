import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    return response.data;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access denied:', data.message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API Error:', data.message || 'Unknown error');
      }
      
      // Return the error response for handling in components
      return Promise.reject({
        message: data.message || 'An error occurred',
        status,
        data
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0
      });
    } else {
      // Other error
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0
      });
    }
  }
);

// AI Service API instance
export const aiApi = axios.create({
  baseURL: process.env.REACT_APP_AI_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI API interceptors
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

aiApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('AI Service Error:', error.response?.data || error.message);
    return Promise.reject({
      message: error.response?.data?.message || 'AI service error',
      status: error.response?.status || 0
    });
  }
);

export default api;