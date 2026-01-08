import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class AdminService {
  // Get admin dashboard data
  async getDashboardData() {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all users for admin management
  async getAllUsers(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.USERS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all donations for admin management
  async getAllDonations(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.DONATIONS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all requests for admin management
  async getAllRequests(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.REQUESTS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Moderate donation
  async moderateDonation(donationId, action, reason = '') {
    try {
      const response = await api.put(
        `/admin/donations/${donationId}/moderate`, 
        { action, reason }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, status, reason = '') {
    try {
      const response = await api.patch(`/users/${userId}/status`, {
        status,
        reason
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== FIXED ANALYTICS METHOD ====================
  // Get comprehensive platform analytics with time range
  async getAnalytics(params = {}) {
    try {
      const { timeRange = '30d' } = params;
      // REMOVED /api prefix since api client already adds it
      const response = await api.get('/analytics', {
        params: { timeRange }
      });
      return response;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Get user activity logs
  async getUserActivityLogs(userId, params = {}) {
    try {
      const response = await api.get(`/admin/users/${userId}/activity`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get system logs
  async getSystemLogs(params = {}) {
    try {
      const response = await api.get('/admin/logs', { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Send notification to users
  async sendNotification(notificationData) {
    try {
      const response = await api.post('/admin/notifications', notificationData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get pending approvals
  async getPendingApprovals() {
    try {
      const [donations, requests, users] = await Promise.all([
        api.get('/donations?status=pending'),
        api.get('/requests?status=pending'),
        api.get('/users?status=pending')
      ]);

      return {
        donations: donations.data,
        requests: requests.data,
        users: users.data
      };
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  async bulkApprove(type, ids) {
    try {
      const response = await api.post(`/admin/bulk-approve`, {
        type,
        ids
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async bulkReject(type, ids, reason) {
    try {
      const response = await api.post(`/admin/bulk-reject`, {
        type,
        ids,
        reason
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Export data
  async exportData(type, format = 'csv', filters = {}) {
    try {
      const response = await api.get(`/admin/export/${type}`, {
        params: {
          format,
          ...filters
        },
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get platform statistics
  async getPlatformStats() {
    try {
      const response = await api.get('/admin/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== REQUEST APPROVAL METHODS ====================
  
  // Get pending requests for admin approval
  async getPendingRequests(params = {}) {
    try {
      const response = await api.get('/admin/requests/pending', { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Approve NGO request
  async approveRequest(requestId, notes = '') {
    try {
      const response = await api.put(`/admin/requests/${requestId}/approve`, { notes });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Reject NGO request
  async rejectRequest(requestId, reason, notes = '') {
    try {
      const response = await api.put(`/admin/requests/${requestId}/reject`, { reason, notes });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new AdminService();
