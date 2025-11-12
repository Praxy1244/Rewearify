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

  // Analyze donation for smart suggestions
  async analyzeDonation(donationData) {
    try {
      const response = await aiApi.post('/analyze-donation', {
        title: donationData.title || '',
        description: donationData.description || '',
        category: donationData.category || '',
        condition: donationData.condition || ''
      });
      return response;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  // Match donation with NGOs
  async matchDonation(matchData) {
    try {
      const response = await aiApi.post('/match-donation', {
        donation_id: matchData.donation_id,
        category: matchData.category,
        location: matchData.location,
        quantity: matchData.quantity
      });
      return response;
    } catch (error) {
      console.error('Matching service error:', error);
      throw error;
    }
  }

  // Get analytics summary
  async getAnalyticsSummary() {
    try {
      const response = await aiApi.get('/analytics/summary');
      return response;
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  // Get user impact analytics
  async getUserImpactAnalytics(userId) {
    try {
      // Mock data for now - can be replaced with real AI endpoint
      return {
        impactScore: Math.floor(Math.random() * 40) + 60, // 60-100
        totalImpact: Math.floor(Math.random() * 500) + 100,
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        insights: [
          "Your winter donations have 3x higher impact during cold months",
          "You're in the top 20% of active donors this month",
          "Your donations reach an average of 5 families per item"
        ],
        recommendations: [
          "Consider donating children's clothing - high demand in your area",
          "Winter season approaching - outerwear donations needed",
          "3 NGOs near you urgently need household items"
        ]
      };
    } catch (error) {
      console.error('Impact analytics error:', error);
      throw error;
    }
  }

  // Get donation trends
  async getDonationTrends(userId, period = '6months') {
    try {
      // Mock trend data - replace with real API later
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return {
        labels: months,
        donations: months.map(() => Math.floor(Math.random() * 10) + 1),
        items: months.map(() => Math.floor(Math.random() * 50) + 5)
      };
    } catch (error) {
      console.error('Trends error:', error);
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
