import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Get popular NGOs
// @route   GET /api/recommendations/popular
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log(`📊 Fetching popular NGOs (limit: ${limit})...`);
    
    const response = await axios.get(`${AI_SERVICE_URL}/recommendations/popular?limit=${limit}`, {
      timeout: 5000
    });

    if (response.data.success) {
      console.log(`✅ Got ${response.data.data.recommendations.length} popular NGOs`);
      return ok(res, response.data.data, 'Popular NGOs retrieved');
    } else {
      console.error('❌ AI service returned error:', response.data.error);
      return fail(res, response.data.error || 'Failed to get popular NGOs', 500);
    }
  } catch (error) {
    console.error('❌ Popular NGOs error:', error.message);
    return fail(res, 'Failed to get popular NGOs', 500);
  }
});

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userLocation = req.user.location?.city;
    
    console.log(`🎯 Getting personalized recommendations for user ${req.user.id}...`);
    
    const response = await axios.post(`${AI_SERVICE_URL}/recommendations/hybrid`, {
      donor_id: req.user.id,
      location: userLocation,
      limit: parseInt(limit)
    }, { timeout: 10000 });

    if (response.data.success) {
      console.log(`✅ Got ${response.data.data.count} recommendations`);
      return ok(res, {
        recommendations: response.data.data.recommendations,
        count: response.data.data.count,
        method: 'hybrid'
      }, 'Recommendations retrieved successfully');
    } else {
      console.log('⚠️ Falling back to popular NGOs...');
      const popularResponse = await axios.get(`${AI_SERVICE_URL}/recommendations/popular?limit=${limit}`);
      
      return ok(res, {
        recommendations: popularResponse.data.data.recommendations,
        count: popularResponse.data.data.recommendations.length,
        method: 'popular',
        note: 'Showing popular NGOs as fallback'
      }, 'Popular NGOs retrieved');
    }
  } catch (error) {
    console.error('❌ Get recommendations error:', error.message);
    return fail(res, 'Failed to get recommendations', 500);
  }
});

// @desc    Get donor profile
// @route   GET /api/recommendations/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    console.log(`👤 Fetching profile for donor ${req.user.id}...`);
    
    const response = await axios.get(`${AI_SERVICE_URL}/recommendations/donor-profile/${req.user.id}`, {
      timeout: 5000
    });

    if (response.data.success) {
      console.log('✅ Profile found');
      return ok(res, response.data.data, 'Donor profile retrieved');
    } else {
      console.log('ℹ️ New donor - no history');
      return ok(res, {
        donor_id: req.user.id,
        profile: null,
        insights: {
          is_new_donor: true,
          message: 'Start donating to build your profile!'
        }
      }, 'No donation history yet');
    }
  } catch (error) {
    console.error('❌ Donor profile error:', error.message);
    return fail(res, 'Failed to get donor profile', 500);
  }
});

// @desc    Get recommendations for donation
// @route   POST /api/recommendations/for-donation
// @access  Private
router.post('/for-donation', protect, async (req, res) => {
  try {
    const { category, location, condition, quantity } = req.body;
    const { limit = 5 } = req.query;
    
    console.log(`🎁 Getting recommendations for donation: ${category}, ${location?.city}`);
    
    const response = await axios.post(`${AI_SERVICE_URL}/recommendations/hybrid`, {
      donor_id: req.user.id,
      location: location?.city || req.user.location?.city,
      limit: parseInt(limit) * 2
    }, { timeout: 10000 });

    if (response.data.success) {
      let recommendations = response.data.data.recommendations;
      
      if (category) {
        recommendations = recommendations.filter(ngo => {
          const acceptedCategories = (ngo.accepted_clothing_types || '').split(';');
          return acceptedCategories.includes(category);
        });
      }
      
      recommendations = recommendations.map(ngo => {
        let matchScore = parseFloat(ngo.recommendation_score) || 0;
        
        if (location && ngo.city?.toLowerCase() === location.city?.toLowerCase()) {
          matchScore += 0.2;
        }
        
        return {
          ...ngo,
          match_score: Math.min(matchScore, 1).toFixed(3),
          match_reasons: [
            ngo.recommendation_reason,
            location && ngo.city?.toLowerCase() === location.city?.toLowerCase() ? 'Same location' : null,
            category ? `Accepts ${category}` : null
          ].filter(Boolean)
        };
      });
      
      recommendations.sort((a, b) => parseFloat(b.match_score) - parseFloat(a.match_score));
      
      console.log(`✅ Found ${recommendations.length} matching NGOs`);
      
      return ok(res, {
        recommendations: recommendations.slice(0, parseInt(limit)),
        count: recommendations.length,
        donation_details: { category, location: location?.city, condition, quantity }
      }, 'NGO recommendations for your donation');
    } else {
      return fail(res, 'Failed to get donation recommendations', 500);
    }
  } catch (error) {
    console.error('❌ Donation recommendations error:', error.message);
    return fail(res, 'Failed to get donation recommendations', 500);
  }
});

export default router;
