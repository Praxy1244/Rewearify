import express from 'express';
import axios from 'axios';
import { ok, fail } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Helper function to handle AI service requests
const fetchFromAI = async (method, endpoint, data = {}, params = {}) => {
  try {
    const config = {
      method,
      url: `${AI_SERVICE_URL}${endpoint}`,
      timeout: 30000, // 30 second timeout
    };

    if (method === 'POST') {
      config.data = data;
    } else {
      config.params = params;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`AI Service Error (${endpoint}):`, error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'AI Service unavailable',
      status: error.response?.status || 503
    };
  }
};

// ==================== EXISTING ROUTES ====================



// @desc    Match donation to NGOs
// @route   POST /api/ai/match
// @access  Private
router.post('/match', protect, async (req, res) => {
  try {
    const result = await fetchFromAI('POST', '/match', req.body);
    
    if (result.success) {
      return ok(res, result.data, 'Matching completed successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    return fail(res, 'Failed to match donation', 500);
  }
});

// @desc    Check donation for fraud
// @route   POST /api/ai/fraud-check
// @access  Private (Admin)
router.post('/fraud-check', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await fetchFromAI('POST', '/fraud-check', req.body);
    
    if (result.success) {
      return ok(res, result.data, 'Fraud check completed successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    return fail(res, 'Failed to check for fraud', 500);
  }
});

// @desc    Get NGO clusters
// @route   GET /api/ai/clusters
// @access  Private (Admin)
router.get('/clusters', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await fetchFromAI('GET', '/clusters');
    
    if (result.success) {
      return ok(res, result.data, 'Clusters retrieved successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    return fail(res, 'Failed to get clusters', 500);
  }
});

// @desc    Get donation trends
// @route   GET /api/ai/trends
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const result = await fetchFromAI('GET', '/trends');
    
    if (result.success) {
      return ok(res, result.data, 'Trends retrieved successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    return fail(res, 'Failed to get trends', 500);
  }
});

// ==================== NEW FORECASTING ROUTES ====================

// @desc    Get demand forecast
// @route   POST /api/ai/forecast
// @access  Private (Admin)
router.post('/forecast', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { clothing_type, city, periods } = req.body;

    if (!clothing_type || !city) {
      return fail(res, 'clothing_type and city are required', 400);
    }

    const result = await fetchFromAI('POST', '/forecast', {
      clothing_type,
      city,
      periods: periods || 30
    });

    if (result.success) {
      return ok(res, result.data.data || result.data, 'Forecast retrieved successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    return fail(res, 'Failed to get forecast', 500);
  }
});

// @desc    Get seasonal trends
// @route   GET /api/ai/seasonal-trends/:clothing_type
// @access  Private (Admin)
router.get('/seasonal-trends/:clothing_type', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { clothing_type } = req.params;
    
    const result = await fetchFromAI('GET', `/seasonal-trends/${clothing_type}`);

    if (result.success) {
      return ok(res, result.data.data || result.data, 'Seasonal trends retrieved successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    console.error('Seasonal trends API error:', error.message);
    return fail(res, 'Failed to get seasonal trends', 500);
  }
});

// @desc    Analyze supply-demand gap
// @route   POST /api/ai/supply-gap
// @access  Private (Admin)
router.post('/supply-gap', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { clothing_type, city, current_supply, periods } = req.body;

    if (!clothing_type || !city || current_supply === undefined) {
      return fail(res, 'clothing_type, city, and current_supply are required', 400);
    }

    const result = await fetchFromAI('POST', '/supply-gap', {
      clothing_type,
      city,
      current_supply: parseInt(current_supply),
      periods: periods || 30
    });

    if (result.success) {
      return ok(res, result.data.data || result.data, 'Gap analysis completed successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    console.error('Supply gap API error:', error.message);
    return fail(res, 'Failed to analyze supply gap', 500);
  }
});

// @desc    Get available forecast categories and cities
// @route   GET /api/ai/forecast-categories
// @access  Private (Admin)
router.get('/forecast-categories', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await fetchFromAI('GET', '/forecast-categories');

    if (result.success) {
      return ok(res, result.data.data || result.data, 'Categories retrieved successfully');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    console.error('Forecast categories API error:', error.message);
    return fail(res, 'Failed to get forecast categories', 500);
  }
});

// @desc    Get forecast summary (combines forecast + trends + gap)
// @route   POST /api/ai/forecast-summary
// @access  Private (Admin)
router.post('/forecast-summary', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { clothing_type, city, current_supply, periods } = req.body;

    if (!clothing_type || !city) {
      return fail(res, 'clothing_type and city are required', 400);
    }

    // Get forecast
    const forecastResult = await fetchFromAI('POST', '/forecast', {
      clothing_type,
      city,
      periods: periods || 30
    });

    // Get seasonal trends
    const trendsResult = await fetchFromAI('GET', `/seasonal-trends/${clothing_type}`);

    // Get supply gap if current_supply provided
    let gapResult = null;
    if (current_supply !== undefined) {
      gapResult = await fetchFromAI('POST', '/supply-gap', {
        clothing_type,
        city,
        current_supply: parseInt(current_supply),
        periods: periods || 30
      });
    }

    const summary = {
      forecast: forecastResult.success ? (forecastResult.data.data || forecastResult.data) : null,
      seasonal_trends: trendsResult.success ? (trendsResult.data.data || trendsResult.data) : null,
      supply_gap: gapResult?.success ? (gapResult.data.data || gapResult.data) : null
    };

    return ok(res, summary, 'Forecast summary retrieved successfully');
  } catch (error) {
    console.error('Forecast summary API error:', error.message);
    return fail(res, 'Failed to get forecast summary', 500);
  }
});

router.post('/analyze-donation', protect, async (req, res) => {
  try {
    // Forward the request to the Python AI Service
    const result = await fetchFromAI('POST', '/analyze-donation', req.body);
    
    if (result.success) {
      // Handle potential data wrapping from AI service
      const data = result.data.data || result.data;
      return ok(res, data, 'Analysis complete');
    }
    return fail(res, result.error, result.status);
  } catch (error) {
    console.error('Analyze donation error:', error);
    return fail(res, 'Failed to analyze donation', 500);
  }
});

export default router;
