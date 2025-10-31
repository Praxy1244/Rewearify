// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password/:token',
    VERIFY_EMAIL: '/auth/verify-email/:token',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHANGE_PASSWORD: '/auth/change-password',
    USERS: '/auth/users'
    
  },

  // Donations
  DONATIONS: {
    BASE: '/donations',
    BY_ID: (id) => `/donations/${id}`,
    BY_USER: (userId) => `/donations/user/${userId}`,
    SEARCH: '/donations'
  },

  // Requests
  REQUESTS: {
    BASE: '/requests',
    BY_ID: (id) => `/requests/${id}`,
    BY_USER: (userId) => `/requests/user/${userId}`,
    SEARCH: '/requests'
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
    NEARBY: '/users/nearby',
    SEARCH: '/users/search',
    STATS: (id) => `/users/${id}/stats`,
    STATUS: (id) => `/users/${id}/status`
  },

  // AI Services
  AI: {
    INSIGHTS: '/ai/insights',
    MATCH_DONATION: '/ai/match-donation',
    FRAUD_DETECTION: '/ai/fraud-detection',
    DEMAND_PREDICTION: '/ai/demand-prediction',
    OPTIMIZE_ROUTES: '/ai/optimize-routes',
    HEALTH: '/ai/health'
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    DONATIONS: '/admin/donations',
    REQUESTS: '/admin/requests',
    ANALYTICS: '/admin/analytics'
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    DONATIONS: '/analytics/donations',
    USERS: '/analytics/users',
    GEOGRAPHY: '/analytics/geography'
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read'
  }
};

// Application Constants
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_APP_NAME || 'Clothing Donation Platform',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  AI_API_URL: process.env.REACT_APP_AI_API_URL || 'http://localhost:8000',
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DONOR: 'donor',
  RECIPIENT: 'recipient'
};

// Donation Categories
export const DONATION_CATEGORIES = [
  'outerwear',
  'formal', 
  'casual',
  'children',
  'accessories',
  'shoes',
  'activewear',
  'undergarments',
  'traditional',
  'seasonal',
  'maternity',
  'plus-size'
];

// Donation Conditions
export const DONATION_CONDITIONS = [
  'excellent',
  'good', 
  'fair',
  'poor'
];

// Request Urgency Levels
export const URGENCY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical'
];

// Status Types
export const STATUS_TYPES = {
  DONATION: [
    'draft',
    'pending', 
    'approved',
    'rejected',
    'matched',
    'completed',
    'cancelled',
    'expired'
  ],
  REQUEST: [
    'draft',
    'active',
    'matched',
    'fulfilled',
    'cancelled',
    'expired'
  ],
  USER: [
    'active',
    'inactive',
    'suspended',
    'banned'
  ]
};

export default {
  API_ENDPOINTS,
  APP_CONFIG,
  USER_ROLES,
  DONATION_CATEGORIES,
  DONATION_CONDITIONS,
  URGENCY_LEVELS,
  STATUS_TYPES
};