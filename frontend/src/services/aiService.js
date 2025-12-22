import api from '../lib/api';

// ==================== EXISTING METHODS ====================

// NGO Matching (Donor)
export const getMatches = (donationData) => {
  // donationData = { type, subtype, quantity, description }
  return api.post('/ai/match', donationData);
};

// Logistics Clusters (Admin)
export const getClusters = () => {
  return api.get('/ai/clusters');
};

// Fraud Review (Admin)
export const checkFraud = (donationData) => {
  return api.post('/ai/fraud-check', donationData);
};

// Trending Items (Recipient)
export const getDonorTrends = () => {
  return api.get('/ai/trends');
};

// Analyze Donation
export const analyzeDonation = (data) => {
  return api.post('/ai/analyze-donation', data);
};

// ==================== NEW FORECASTING METHODS ====================

/**
 * Get comprehensive forecast summary
 * @param {Object} params - { clothing_type, city, periods, current_supply }
 */
export const getForecastSummary = async (params = {}) => {
  const {
    clothing_type = 'winter_wear',
    city = 'Bangalore',
    periods = 30,
    current_supply = null
  } = params;

  const payload = {
    clothing_type,
    city,
    periods
  };

  if (current_supply !== null) {
    payload.current_supply = current_supply;
  }

  return api.post('/ai/forecast-summary', payload);
};

/**
 * Get single forecast for clothing type and city
 */
export const getForecast = (params = {}) => {
  const {
    clothing_type = 'winter_wear',
    city = 'Bangalore',
    periods = 30
  } = params;

  return api.post('/ai/forecast', {
    clothing_type,
    city,
    periods
  });
};

/**
 * Get seasonal trends for a clothing type
 */
export const getSeasonalTrends = (clothingType) => {
  return api.get(`/ai/seasonal-trends/${clothingType}`);
};

/**
 * Get supply-demand gap analysis
 */
export const getSupplyGap = (data) => {
  const {
    clothing_type,
    city,
    current_supply,
    periods = 30
  } = data;

  return api.post('/ai/supply-gap', {
    clothing_type,
    city,
    current_supply: parseInt(current_supply),
    periods
  });
};

/**
 * Get available forecast categories and cities
 */
export const getForecastCategories = () => {
  return api.get('/ai/forecast-categories');
};

// ==================== EXPORT ALL ====================

const aiService = {
  // Existing
  getMatches,
  getClusters,
  checkFraud,
  getDonorTrends,
  analyzeDonation,
  
  // New Forecasting
  getForecastSummary,
  getForecast,
  getSeasonalTrends,
  getSupplyGap,
  getForecastCategories
};

export default aiService;
