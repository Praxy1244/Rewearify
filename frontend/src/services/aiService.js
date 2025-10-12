import api, { aiApi } from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';

class aiService {
  // Get AI insights for admin dashboard
  async getInsights() {
    try {
      const response = await api.get(API_ENDPOINTS.AI.INSIGHTS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get matching suggestions for donation
  async getMatchingSuggestions(donationId) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.MATCH_DONATION, {
        donationId
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Perform fraud detection analysis
  async performFraudDetection(data) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.FRAUD_DETECTION, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get demand prediction
  async getDemandPrediction(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.AI.DEMAND_PREDICTION, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Optimize delivery routes
  async optimizeRoutes(routeData) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.OPTIMIZE_ROUTES, routeData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check AI service health
  async checkHealth() {
    try {
      const response = await api.get(API_ENDPOINTS.AI.HEALTH);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Analyze donation (direct AI service call)
  async analyzeDonation(donationData) {
    try {
      const response = await aiApi.post('/analyze-donation', {
        title: donationData.title,
        description: donationData.description,
        category: donationData.category,
        condition: donationData.condition
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get ML model predictions
  async getMLPredictions(modelType, inputData) {
    try {
      const response = await aiApi.post(`/predict/${modelType}`, inputData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Fraud detection for users
  async detectUserFraud(userId) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.FRAUD_DETECTION, {
        type: 'user',
        userId
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Fraud detection for donations
  async detectDonationFraud(donationId) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.FRAUD_DETECTION, {
        type: 'donation',
        donationId
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get AI recommendations for user
  async getUserRecommendations(userId, type = 'donations') {
    try {
      const response = await aiApi.get(`/recommendations/${type}/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Analyze donation impact
  async analyzeDonationImpact(donationId) {
    try {
      const response = await aiApi.post('/analyze-impact', { donationId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get matching score between donation and request
  async getMatchingScore(donationId, requestId) {
    try {
      const response = await aiApi.post('/matching-score', {
        donationId,
        requestId
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Predict seasonal demand
  async predictSeasonalDemand(category, location) {
    try {
      const response = await aiApi.post('/predict-seasonal-demand', {
        category,
        location
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new aiService();