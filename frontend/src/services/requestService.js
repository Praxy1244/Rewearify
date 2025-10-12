import api from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class RequestService {
  // Get all requests with filters
  async getRequests(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.REQUESTS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get single request by ID
  async getRequestById(id) {
    try {
      const response = await api.get(API_ENDPOINTS.REQUESTS.BY_ID(id));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Create new request
  async createRequest(requestData) {
    try {
      const response = await api.post(API_ENDPOINTS.REQUESTS.BASE, requestData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update request
  async updateRequest(id, requestData) {
    try {
      const response = await api.put(API_ENDPOINTS.REQUESTS.BY_ID(id), requestData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete request
  async deleteRequest(id) {
    try {
      const response = await api.delete(API_ENDPOINTS.REQUESTS.BY_ID(id));
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

  // Search requests
  async searchRequests(searchParams) {
    try {
      const response = await api.get(API_ENDPOINTS.REQUESTS.SEARCH, { 
        params: searchParams 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get nearby requests
  async getNearbyRequests(lat, lng, radius = 25, filters = {}) {
    try {
      const params = {
        lat,
        lng,
        radius,
        ...filters
      };
      const response = await api.get(API_ENDPOINTS.REQUESTS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get urgent requests
  async getUrgentRequests(limit = 10) {
    try {
      const params = {
        urgency: 'high,critical',
        sortBy: 'urgency',
        sortOrder: 'desc',
        limit
      };
      const response = await api.get(API_ENDPOINTS.REQUESTS.BASE, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get requests by category
  async getRequestsByCategory(category, params = {}) {
    try {
      const searchParams = {
        category,
        ...params
      };
      const response = await api.get(API_ENDPOINTS.REQUESTS.BASE, { 
        params: searchParams 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Match request with donation
  async matchRequest(requestId, donationId, matchScore = 0) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REQUESTS.BY_ID(requestId)}/match`, {
        donationId,
        matchScore
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Fulfill request
  async fulfillRequest(requestId, fulfillmentData) {
    try {
      const response = await api.post(`${API_ENDPOINTS.REQUESTS.BY_ID(requestId)}/fulfill`, 
        fulfillmentData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new RequestService();