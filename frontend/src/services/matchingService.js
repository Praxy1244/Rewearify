// frontend/src/services/matchingService.js
import api from '../lib/api';

const matchingService = {
  /**
   * Get matching requests for a donation
   * @param {string} donationId - Donation ID
   * @returns {Promise} - Match results
   */
  getMatchesForDonation: async (donationId) => {
    try {
      const response = await api.get(`/matching/donation/${donationId}`);
      return response.data;
    } catch (error) {
      console.error('Get donation matches error:', error);
      throw error.response?.data || { message: 'Failed to get matches' };
    }
  },

  /**
   * Get matching donations for a request
   * @param {string} requestId - Request ID
   * @returns {Promise} - Match results
   */
  getMatchesForRequest: async (requestId) => {
    try {
      const response = await api.get(`/matching/request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Get request matches error:', error);
      throw error.response?.data || { message: 'Failed to get matches' };
    }
  }
};

export default matchingService;
