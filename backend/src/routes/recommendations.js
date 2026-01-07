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
    const limit = parseInt(req.query.limit) || 20;
    
    const User = (await import('../models/User.js')).default;
    const popularNGOs = await User.find({ role: 'recipient' })
      .sort({ trust_score: -1, impact_score: -1 })
      .limit(limit);

    // ✅ FIX: Convert location objects to strings
    const recommendations = popularNGOs.map(ngo => ({
      _id: ngo._id.toString(),
      id: ngo._id.toString(),
      name: ngo.organization?.name || ngo.name || 'Unknown NGO',
      location: ngo.location?.city || ngo.location?.address || 'Unknown',
      city: ngo.location?.city || 'Unknown',
      trust_score: ngo.trust_score || 4.0,
      impact_score: ngo.impact_score || 4.0,
      match_score: 0.8
    }));

    return ok(res, { recommendations, count: recommendations.length }, 'Popular NGOs retrieved');
  } catch (error) {
    console.error('Popular NGOs error:', error);
    return serverError(res, 'Failed to get popular NGOs');
  }
});


// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`🎯 Personalized recommendations for user ${req.user.id}`);

    try {
      const response = await axios.get(`${AI_SERVICE_URL}/recommendations/hybrid`, {
        params: {
          donor_id: req.user.id,
          limit: limit
        },
        timeout: 10000
      });

      if (response.data.success && response.data.data.recommendations) {
        // ✅ FIX: Convert location objects to strings
        const fixedRecommendations = response.data.data.recommendations.map(ngo => ({
          ...ngo,
          location: typeof ngo.location === 'string' 
            ? ngo.location 
            : (ngo.location?.city || ngo.location?.address || 'Unknown'),
          city: ngo.location?.city || ngo.city || 'Unknown'
        }));

        console.log(`✅ Got ${fixedRecommendations.length} recommendations`);
        return ok(res, {
          recommendations: fixedRecommendations,
          count: fixedRecommendations.length,
          method: response.data.data.method || 'hybrid'
        }, 'Recommendations retrieved');
      }
    } catch (aiError) {
      console.log('⚠️ AI service unavailable, using fallback');
    }

    // Fallback to popular NGOs
    const User = (await import('../models/User.js')).default;
    const popularNGOs = await User.find({ role: 'recipient' })
      .sort({ trust_score: -1, impact_score: -1 })
      .limit(limit);

    // ✅ FIX: Convert location objects to strings for fallback too
    const fixedPopularNGOs = popularNGOs.map(ngo => ({
      _id: ngo._id.toString(),
      id: ngo._id.toString(),
      name: ngo.organization?.name || ngo.name || 'Unknown NGO',
      location: ngo.location?.city || ngo.location?.address || 'Unknown',
      city: ngo.location?.city || 'Unknown',
      trust_score: ngo.trust_score || 4.0,
      impact_score: ngo.impact_score || 4.0,
      score: 0.7,
      reason: 'Popular NGO in your area'
    }));

    console.log(`✅ Got ${fixedPopularNGOs.length} recommendations`);
    return ok(res, {
      recommendations: fixedPopularNGOs,
      count: fixedPopularNGOs.length,
      method: 'popular'
    }, 'Popular recommendations retrieved');

  } catch (error) {
    console.error('❌ Recommendations error:', error.message);
    return serverError(res, 'Failed to get recommendations');
  }
});


// @desc    Get donor profile insights
// @route   GET /api/recommendations/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    console.log(`👤 Fetching profile for donor ${req.user.id}`);
    
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/recommendations/donor-profile/${req.user.id}`, {
        timeout: 5000
      });

      if (response.data.success) {
        console.log('✅ Profile retrieved');
        return ok(res, response.data.data, 'Donor profile retrieved');
      }
    } catch (aiError) {
      console.log('⚠️ AI profile not available, returning basic profile');
      // ✅ FALLBACK: Return a basic profile instead of failing
      return ok(res, {
        profile: {
          donation_frequency: 0,
          activity_level: 'New',
          avg_items_per_donation: 0,
          preferred_categories: [],
          message: 'Make a few donations to see your AI-generated profile'
        }
      }, 'Basic profile retrieved');
    }
  } catch (error) {
    console.error('❌ Profile error:', error.message);
    // ✅ Return empty profile instead of error
    return ok(res, {
      profile: null
    }, 'Profile not available');
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
