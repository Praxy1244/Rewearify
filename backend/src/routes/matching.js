// backend/src/routes/matching.js
import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';

const router = express.Router();

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   GET /api/matching/donation/:donationId
 * @desc    Find matching requests for a specific donation
 * @access  Private (Donor)
 */
router.get('/donation/:donationId', protect, async (req, res) => {
  try {
    const { donationId } = req.params;
    
    console.log(`🔍 Finding matches for donation: ${donationId}`);
    
    // Get the donation
    const donation = await Donation.findById(donationId).populate('donor', 'name location');
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    // Verify user owns this donation
    if (donation.donor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view matches for this donation'
      });
    }
    
    // Get all active requests
    const requests = await Request.find({ 
      status: 'active' 
    }).populate('requester', 'name organization location contact');
    
    console.log(`📋 Found ${requests.length} active requests`);
    
    // Call AI service to find matches
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/match-requests`, {
      donation: donation.toObject(),
      requests: requests.map(r => r.toObject())
    });
    
    if (aiResponse.data.success) {
      console.log(`✅ Found ${aiResponse.data.data.total_matches} matches`);
      
      return res.json({
        success: true,
        data: {
          donation: {
            id: donation._id,
            title: donation.title,
            category: donation.category,
            subcategory: donation.subcategory,
            quantity: donation.quantity,
            condition: donation.condition
          },
          matches: aiResponse.data.data.matches,
          totalMatches: aiResponse.data.data.total_matches
        }
      });
    } else {
      throw new Error('AI matching failed');
    }
    
  } catch (error) {
    console.error('❌ Matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matches',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/matching/request/:requestId
 * @desc    Find matching donations for a specific request
 * @access  Private (NGO)
 */
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    console.log(`🔍 Finding matches for request: ${requestId}`);
    
    // Get the request
    const request = await Request.findById(requestId).populate('requester', 'name location');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Verify user owns this request
    if (request.requester._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view matches for this request'
      });
    }
    
    // Get all available donations (approved and same category for efficiency)
    const donations = await Donation.find({ 
      status: 'approved',
      category: request.category
    }).populate('donor', 'name location contact');
    
    console.log(`📋 Found ${donations.length} available donations`);
    
    // Find which donations match this request
    const matches = [];
    
    for (const donation of donations) {
      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/match-requests`, {
          donation: donation.toObject(),
          requests: [request.toObject()]
        });
        
        if (aiResponse.data.success && aiResponse.data.data.matches.length > 0) {
          const match = aiResponse.data.data.matches[0];
          matches.push({
            donation_id: donation._id,
            donation_title: donation.title,
            donor_name: donation.donor.name,
            donor_id: donation.donor._id,
            score: match.score,
            distance_km: match.distance_km,
            reasons: match.reasons,
            quantity: donation.quantity,
            condition: donation.condition,
            category: donation.category,
            subcategory: donation.subcategory,
            location: {
              city: donation.location.city,
              state: donation.location.state
            }
          });
        }
      } catch (err) {
        console.error(`⚠️ Error matching donation ${donation._id}:`, err.message);
        // Continue with other donations
      }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    console.log(`✅ Found ${matches.length} total matches`);
    
    return res.json({
      success: true,
      data: {
        request: {
          id: request._id,
          title: request.title,
          category: request.category,
          subcategory: request.subcategory,
          quantity: request.quantity,
          urgency: request.urgency
        },
        matches: matches.slice(0, 10), // Top 10
        totalMatches: matches.length
      }
    });
    
  } catch (error) {
    console.error('❌ Matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matches',
      error: error.message
    });
  }
});

export default router;
