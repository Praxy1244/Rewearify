import api from '../lib/api'; // Assuming you have an axios instance here

// 1. Smart Form Suggestions (Donor)
export const getSubtypeSuggestions = (type) => {
  return api.get(`/ai/suggest?type=${type}`);
};

// 2. NGO Matching (Donor)
export const getMatches = (donationData) => {
  // donationData = { type, subtype, quantity, description }
  return api.post('/ai/match', donationData);
};

// 3. Analytics Forecast (Admin)
export const getForecast = () => {
  return api.get('/ai/forecast');
};

// 4. Logistics Clusters (Admin)
export const getClusters = () => {
  return api.get('/ai/clusters');
};

// 5. Fraud Review (Admin - Optional if you want manual checks)
export const checkFraud = (donationData) => {
  return api.post('/ai/fraud-check', donationData);
};

// 6. Trending Items (Recipient)
export const getDonorTrends = () => {
  return api.get('/ai/trends');
};



const aiService = {
  getSubtypeSuggestions,
  getMatches,
  getForecast,
  getClusters,
  checkFraud,
  getDonorTrends
};

export default aiService;