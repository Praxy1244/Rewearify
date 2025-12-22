import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Get popular NGOs (fallback for new users)
// @route   GET /api/recommendations/popular
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log(`📊 Fetching ${limit} popular NGOs...`);
    
    const response = await axios.get(`${AI_SERVICE_URL}/recommendations/popular?limit=${limit}`, {
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`✅ Got ${response.data.data.recommendations.length} popular NGOs`);
      return ok(res, response.data.data, 'Popular NGOs retrieved');
    } else {
      return fail(res, 'Failed to get popular NGOs', 500);
    }
  } catch (error) {
    console.error('❌ Popular NGOs error:', error.message);
    return fail(res, 'Failed to get popular NGOs', 500);
  }
});

// @desc    Get personalized recommendations (USER PROFILE-BASED)
// @route   GET /api/recommendations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userLocation = req.user.location?.city;
    
    console.log(`🎯 Personalized recommendations for user ${req.user.id}`);
    
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
        method: response.data.data.method
      }, 'Recommendations retrieved');
    } else {
      console.log('⚠️ Falling back to popular...');
      const popularResponse = await axios.get(`${AI_SERVICE_URL}/recommendations/popular?limit=${limit}`);
      
      return ok(res, {
        recommendations: popularResponse.data.data.recommendations,
        count: popularResponse.data.data.recommendations.length,
        method: 'popular',
        note: 'Showing popular NGOs'
      }, 'Popular NGOs retrieved');
    }
  } catch (error) {
    console.error('❌ Recommendations error:', error.message);
    return fail(res, 'Failed to get recommendations', 500);
  }
});

// @desc    Get donor profile insights
// @route   GET /api/recommendations/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    console.log(`👤 Fetching profile for donor ${req.user.id}`);
    
    const response = await axios.get(`${AI_SERVICE_URL}/recommendations/donor-profile/${req.user.id}`, {
      timeout: 5000
    });

    if (response.data.success) {
      console.log('✅ Profile retrieved');
      return ok(res, response.data.data, 'Donor profile retrieved');
    } else {
      return fail(res, 'Failed to get profile', 500);
    }
  } catch (error) {
    console.error('❌ Profile error:', error.message);
    return fail(res, 'Failed to get donor profile', 500);
  }
});

// @desc    Get NGO matches for SPECIFIC DONATION
// @route   POST /api/recommendations/for-donation
// @access  Private
router.post('/for-donation', protect, async (req, res) => {
  try {
    const { category, location, condition, quantity, season } = req.body;
    
    console.log(`🎁 Matching donation: ${category} at ${location?.city || 'unknown location'}`);
    console.log(`   Coordinates:`, location?.coordinates);
    
    // Get coordinates
    let lat = 12.9716; // Default Bengaluru
    let lng = 77.5946;
    
    if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      lng = location.coordinates[0]; // longitude first in GeoJSON
      lat = location.coordinates[1]; // latitude second
    }
    
    console.log(`   Using coordinates: [${lat}, ${lng}]`);
    
    // ✅ FIX: Call the MATCHING endpoint
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/match-donations`, {
      type: category || 'Clothing',
      season: season || 'All Season',
      quantity: quantity || 1,
      latitude: lat,
      longitude: lng,
      description: `${category || 'Clothing'} in ${condition || 'good'} condition`,
      max_distance: 50
    }, { timeout: 10000 });

    console.log(`   AI Service response:`, response.data.success, response.data.total_matches);

    if (response.data.success && response.data.matches && response.data.matches.length > 0) {
      // ✅ Transform to match frontend expectations
      const recommendations = response.data.matches.map((match, index) => ({
        _id: match.ngo_id,
        id: match.ngo_id,
        name: match.ngo_name,
        city: match.location?.city || 'Unknown',
        location: match.location?.city || 'Unknown',
        trust_score: match.trust_score || 4.5,
        impact_score: match.impact_score || 4.0,
        distance: match.distance,
        score: match.match_score / 100,
        match_score: match.match_score / 100,
        reason: match.reason || `${match.distance.toFixed(1)}km away, ${match.match_score}% match`,
        match_reasons: [
          `${match.distance.toFixed(1)}km away`, 
          `${match.match_score}% compatible`,
          `Accepts ${category || 'clothing'}`
        ]
      }));
      
      console.log(`✅ Returning ${recommendations.length} matched NGOs`);
      
      return ok(res, {
        recommendations: recommendations,
        count: recommendations.length,
        donation_details: { 
          category: category || 'Clothing', 
          location: location?.city || 'Unknown', 
          condition, 
          quantity 
        }
      }, 'NGO matches found');
    } else {
      console.log('⚠️ No matches found from AI service');
      return ok(res, {
        recommendations: [],
        count: 0,
        donation_details: { category, location: location?.city, condition, quantity }
      }, 'No matching NGOs found');
    }
  } catch (error) {
    console.error('❌ Donation matching error:', error.message);
    if (error.response) {
      console.error('   AI service error:', error.response.data);
    }
    
    // Return empty array instead of failing
    return ok(res, {
      recommendations: [],
      count: 0,
      error: error.message
    }, 'Failed to find matching NGOs');
  }
});


export default router;
