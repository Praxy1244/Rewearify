import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      if (response.success && response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('rewearify_token', response.data.token); // Keep compatibility
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);

      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rewearify_token');
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD.replace(':token', token), {
        password
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL.replace(':token', token));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email
  async resendVerification() {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all users (Admin only)
  async getAllUsers(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.USERS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get stored user data
  getStoredUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();