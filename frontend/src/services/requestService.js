import api from '../lib/api';

const requestService = {
  // Create new request
  createRequest: async (requestData) => {
    try {
      // api.js interceptor returns response.data automatically
      return await api.post('/requests', requestData);
    } catch (error) {
      console.error('Create request error:', error);
      throw error; // api.js interceptor already formats the error
    }
  },

  // Get NGO's requests
  getMyRequests: async (ngoId) => {
    try {
      // ✅ Calls the correct endpoint: /user/:userId
      // Returns { success: true, data: [...], pagination: {...} }
      return await api.get(`/requests/user/${ngoId}`);
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },

  // Get user requests (same as above)
  getUserRequests: async (userId) => {
    try {
      return await api.get(`/requests/user/${userId}`);
    } catch (error) {
      console.error('Get user requests error:', error);
      throw error;
    }
  },

  // Get single request
  getRequest: async (requestId) => {
    try {
      return await api.get(`/requests/${requestId}`);
    } catch (error) {
      console.error('Get request error:', error);
      throw error;
    }
  },

  // Update request
  updateRequest: async (requestId, updates) => {
    try {
      return await api.put(`/requests/${requestId}`, updates);
    } catch (error) {
      console.error('Update request error:', error);
      throw error;
    }
  },

  // Mark request as complete
  completeRequest: async (requestId) => {
    try {
      return await api.patch(`/requests/${requestId}/complete`);
    } catch (error) {
      console.error('Complete request error:', error);
      throw error;
    }
  },

  // Delete request
  deleteRequest: async (requestId) => {
    try {
      return await api.delete(`/requests/${requestId}`);
    } catch (error) {
      console.error('Delete request error:', error);
      throw error;
    }
  },

  // Get all active requests
  getActiveRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      return await api.get(`/requests?${params}`);
    } catch (error) {
      console.error('Get active requests error:', error);
      throw error;
    }
  }
};

export default requestService;
