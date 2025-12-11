import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class NotificationService {
  // Get user notifications
  async getNotifications(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // 💡 NEW: Delete all notifications
  async deleteAll() {
    try {
      // This calls DELETE /api/notifications/all
      const response = await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/all`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await api.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/unread-count`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.put(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/preferences`, preferences);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await api.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/preferences`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationService();