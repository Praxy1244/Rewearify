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
  },

  // Alias for getActiveRequests (used by BrowseNeeds)
  getRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      return await api.get(`/requests?${params}`);
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },
// Get general community requests (not linked to specific donations)
getCommunityRequests: async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    return await api.get(`/requests/community?${params}`);
  } catch (error) {
    console.error('Get community requests error:', error);
    throw error;
  }
},

  // ==================== NEW: DONOR RESPONSE METHODS ====================
  
  // Get pending requests for donor's donations
  getPendingRequestsForDonor: async () => {
    try {
      return await api.get('/requests/donor/pending');
    } catch (error) {
      console.error('Get pending donor requests error:', error);
      throw error;
    }
  },

  // Donor accepts a request
  acceptRequest: async (requestId, note = '') => {
    try {
      return await api.post(`/requests/${requestId}/accept`, { note });
    } catch (error) {
      console.error('Accept request error:', error);
      throw error;
    }
  },

  // Donor rejects a request
  rejectRequest: async (requestId, reason) => {
    try {
      return await api.post(`/requests/${requestId}/reject`, { reason });
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  },

  // Donor provides pickup/delivery details
  provideLogistics: async (requestId, logisticsData) => {
    try {
      return await api.post(`/requests/${requestId}/logistics`, logisticsData);
    } catch (error) {
      console.error('Provide logistics error:', error);
      throw error;
    }
  },

  // Update request status (in_transit, delivered)
  updateRequestStatus: async (requestId, status, note = '') => {
    try {
      return await api.put(`/requests/${requestId}/status`, { status, note });
    } catch (error) {
      console.error('Update request status error:', error);
      throw error;
    }
  },

  // Recipient submits feedback
  submitFeedback: async (requestId, feedbackData) => {
    try {
      return await api.post(`/requests/${requestId}/feedback`, feedbackData);
    } catch (error) {
      console.error('Submit feedback error:', error);
      throw error;
    }
  },

  // Admin marks request as completed
  adminCompleteRequest: async (requestId) => {
    try {
      return await api.put(`/requests/${requestId}/complete`);
    } catch (error) {
      console.error('Admin complete request error:', error);
      throw error;
    }
  },

  // Get congratulations data for a completed request
getCongratulations: async (requestId) => {
  try {
    return await api.get(`/requests/${requestId}/congratulations`);
  } catch (error) {
    console.error('Get congratulations error:', error);
    throw error;
  }
},

};

export default requestService;
