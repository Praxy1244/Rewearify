import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';


class DonationService {
  // Get all donations with filters
  async getDonations(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.DONATIONS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Get single donation by ID
  async getDonationById(id) {
    try {
      const response = await api.get(API_ENDPOINTS.DONATIONS.BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get donations by user ID
  async getUserDonations(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.DONATIONS.BY_USER(userId));
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Create new donation
  async createDonation(donationData) {
    try {
      const response = await api.post(API_ENDPOINTS.DONATIONS.BASE, donationData);
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Update donation
  async updateDonation(id, donationData) {
    try {
      const response = await api.put(API_ENDPOINTS.DONATIONS.BY_ID(id), donationData);
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Delete donation
  async deleteDonation(id) {
    try {
      const response = await api.delete(API_ENDPOINTS.DONATIONS.BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Search donations
  async searchDonations(searchParams) {
    try {
      const response = await api.get(API_ENDPOINTS.DONATIONS.SEARCH, { 
        params: searchParams 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Get nearby donations
  async getNearbyDonations(lat, lng, radius = 25, filters = {}) {
    try {
      const params = {
        lat,
        lng,
        radius,
        ...filters
      };
      const response = await api.get(API_ENDPOINTS.DONATIONS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Get trending donations
  async getTrendingDonations(limit = 10) {
    try {
      const params = {
        sortBy: 'viewCount',
        sortOrder: 'desc',
        limit
      };
      const response = await api.get(API_ENDPOINTS.DONATIONS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Get donations by category
  async getDonationsByCategory(category, params = {}) {
    try {
      const searchParams = {
        category,
        ...params
      };
      const response = await api.get(API_ENDPOINTS.DONATIONS.BASE, { 
        params: searchParams 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }


  // Get urgent donations
  async getUrgentDonations(limit = 10) {
    try {
      const params = {
        urgent: 'true',
        limit
      };
      const response = await api.get(API_ENDPOINTS.DONATIONS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ✅ NEW METHOD: Get congratulations details for a donation
  async getCongratulations(donationId) {
    try {
      const response = await api.get(`/donations/${donationId}/congratulations`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}




export default new DonationService();
