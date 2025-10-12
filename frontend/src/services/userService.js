import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class UserService {
  // Get user profile by ID
  async getUserById(id) {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(id, profileData) {
    try {
      const response = await api.put(API_ENDPOINTS.USERS.BY_ID(id), profileData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get nearby users
  async getNearbyUsers(lat, lng, radius = 25, role = null) {
    try {
      const params = {
        lat,
        lng,
        radius
      };
      if (role) params.role = role;
      
      const response = await api.get(API_ENDPOINTS.USERS.NEARBY, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Search users
  async searchUsers(query, filters = {}) {
    try {
      const params = {
        q: query,
        ...filters
      };
      const response = await api.get(API_ENDPOINTS.USERS.SEARCH, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(id) {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.STATS(id));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update user status (Admin only)
  async updateUserStatus(id, status) {
    try {
      const response = await api.patch(API_ENDPOINTS.USERS.STATUS(id), { status });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user's donations
  async getUserDonations(userId, params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.DONATIONS.BY_USER(userId), { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user's requests
  async getUserRequests(userId, params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.REQUESTS.BY_USER(userId), { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user dashboard data
  async getUserDashboard(userId) {
    try {
      const [profile, stats, donations, requests] = await Promise.all([
        this.getUserById(userId),
        this.getUserStats(userId),
        this.getUserDonations(userId, { limit: 5 }),
        this.getUserRequests(userId, { limit: 5 })
      ]);

      return {
        profile: profile.data,
        stats: stats.data,
        recentDonations: donations.data,
        recentRequests: requests.data
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.post(
        `${API_ENDPOINTS.USERS.BY_ID(userId)}/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.USERS.BY_ID(userId)}/preferences`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put(
        `${API_ENDPOINTS.USERS.BY_ID(userId)}/preferences`,
        preferences
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();