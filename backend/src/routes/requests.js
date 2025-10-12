import express from 'express';
import Request from '../models/Request.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { requestValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';

const router = express.Router();

// @desc    Get all requests with filters
// @route   GET /api/requests
// @access  Public
router.get('/', searchValidations.donations, handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      urgency,
      location,
      radius = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'active',
      search
    } = req.query;

    // Build query
    let query = { status };
    
    if (category) query.category = category;
    if (urgency) query.urgency = { $in: urgency.split(',') };
    
    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based search
    if (location && req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000
        }
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const requests = await Request.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('requester', 'name profile.profilePicture organization location.city statistics.rating');

    const total = await Request.countDocuments(query);

    return paginated(res, requests, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Requests retrieved successfully');
  } catch (error) {
    console.error('Get requests error:', error);
    return fail(res, 'Failed to get requests', 500);
  }
});

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name profile.profilePicture organization location contact statistics.rating verification.isOrganizationVerified')
      .populate('donation', 'title images status');

    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Increment view count if not the owner
    if (!req.user || req.user.id !== request.requester._id.toString()) {
      await request.incrementViews();
    }

    return ok(res, { request }, 'Request retrieved successfully');
  } catch (error) {
    console.error('Get request error:', error);
    return fail(res, 'Failed to get request', 500);
  }
});

// @desc    Create new request
// @route   POST /api/requests
// @access  Private (Recipient)
router.post('/', 
  protect, 
  restrictTo('recipient'), 
  requestValidations.create, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        requester: req.user.id
      };

      // Create request
      const request = await Request.create(requestData);

      // Update user statistics
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'statistics.totalRequests': 1 }
      });

      // Find potential matches using AI
      try {
        await findPotentialMatches(request._id);
      } catch (matchError) {
        console.error('Error finding matches:', matchError);
      }

      // Notify nearby donors about urgent requests
      if (request.urgency === 'high' || request.urgency === 'critical') {
        await notifyNearbyDonors(request);
      }

      return created(res, { request }, 'Request created successfully');
    } catch (error) {
      console.error('Create request error:', error);
      return fail(res, 'Failed to create request', 500);
    }
  }
);

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private (Owner or Admin)
router.put('/:id', 
  protect, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      
      if (!request) {
        return fail(res, 'Request not found', 404);
      }

      // Check ownership or admin
      if (req.user.role !== 'admin' && request.requester._id.toString() !== req.user.id) {
        return fail(res, 'Not authorized to update this request', 403);
      }

      // Only allow updates if request is active
      if (request.status !== 'active' && req.user.role !== 'admin') {
        return fail(res, 'Cannot update request in current status', 400);
      }

      // Update request
      const updatedRequest = await Request.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      return ok(res, { request: updatedRequest }, 'Request updated successfully');
    } catch (error) {
      console.error('Update request error:', error);
      return fail(res, 'Failed to update request', 500);
    }
  }
);

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && request.requester._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to delete this request', 403);
    }

    // Only allow deletion if not matched or fulfilled
    if (['matched', 'fulfilled'].includes(request.status)) {
      return fail(res, 'Cannot delete request that is matched or fulfilled', 400);
    }

    // Delete request
    await Request.findByIdAndDelete(req.params.id);

    // Update user statistics
    await User.findByIdAndUpdate(request.requester._id, {
      $inc: { 'statistics.totalRequests': -1 }
    });

    return ok(res, null, 'Request deleted successfully');
  } catch (error) {
    console.error('Delete request error:', error);
    return fail(res, 'Failed to delete request', 500);
  }
});

// @desc    Get user's requests
// @route   GET /api/requests/user/:userId
// @access  Private (Owner or Admin)
router.get('/user/:userId', protect, adminOrOwner('userId'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { requester: req.params.userId };
    if (status) query.status = status;

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donation', 'title images status');

    const total = await Request.countDocuments(query);

    return paginated(res, requests, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'User requests retrieved successfully');
  } catch (error) {
    console.error('Get user requests error:', error);
    return fail(res, 'Failed to get user requests', 500);
  }
});

// @desc    Get urgent requests
// @route   GET /api/requests/urgent
// @access  Public
router.get('/urgent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const urgentRequests = await Request.getUrgent(parseInt(limit));

    return ok(res, { requests: urgentRequests }, 'Urgent requests retrieved successfully');
  } catch (error) {
    console.error('Get urgent requests error:', error);
    return fail(res, 'Failed to get urgent requests', 500);
  }
});

// @desc    Get nearby requests for donor
// @route   GET /api/requests/nearby
// @access  Private (Donor)
router.get('/nearby', protect, restrictTo('donor'), async (req, res) => {
  try {
    const { lat, lng, radius = 25, limit = 20 } = req.query;

    if (!lat || !lng) {
      return fail(res, 'Latitude and longitude are required', 400);
    }

    const coordinates = [parseFloat(lng), parseFloat(lat)];
    const maxDistance = radius * 1000; // Convert km to meters

    const nearbyRequests = await Request.findNearby(coordinates, maxDistance)
      .limit(parseInt(limit))
      .sort({ urgency: -1, 'timeline.neededBy': 1 });

    return ok(res, { requests: nearbyRequests }, 'Nearby requests retrieved successfully');
  } catch (error) {
    console.error('Get nearby requests error:', error);
    return fail(res, 'Failed to get nearby requests', 500);
  }
});

// Helper function to find potential matches
async function findPotentialMatches(requestId) {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${aiServiceUrl}/find-matches`, {
      requestId: requestId,
      maxMatches: 5
    }, {
      timeout: 10000
    });

    if (response.data && response.data.matches) {
      // Update request with potential matches
      await Request.findByIdAndUpdate(requestId, {
        'matching.potentialMatches': response.data.matches
      });

      // Notify requester about potential matches
      const request = await Request.findById(requestId).populate('requester', 'name email');
      
      if (response.data.matches.length > 0) {
        await Notification.createAndSend({
          recipient: request.requester._id,
          type: 'match_suggestion',
          title: 'Potential Matches Found',
          message: `We found ${response.data.matches.length} potential matches for your request "${request.title}"`,
          data: {
            requestId: requestId,
            actionUrl: `/recipient/my-requests/${requestId}`
          },
          channels: { inApp: true, email: true }
        });
      }
    }
  } catch (error) {
    console.error('AI matching error:', error);
    throw error;
  }
}

// Helper function to notify nearby donors
async function notifyNearbyDonors(request) {
  try {
    // Find donors within 25km
    const nearbyDonors = await User.find({
      role: 'donor',
      status: 'active',
      'preferences.notifications.push': true,
      'location.coordinates': {
        $near: {
          $geometry: request.location.coordinates,
          $maxDistance: 25000 // 25km
        }
      }
    }).limit(50);

    // Send notifications to nearby donors
    for (const donor of nearbyDonors) {
      await Notification.createAndSend({
        recipient: donor._id,
        type: 'new_request_nearby',
        title: 'Urgent Request Nearby',
        message: `New ${request.urgency} priority request "${request.title}" near your location`,
        data: {
          requestId: request._id,
          actionUrl: `/donor/browse-needs/${request._id}`
        },
        channels: { inApp: true, push: true }
      });
    }
  } catch (error) {
    console.error('Error notifying nearby donors:', error);
  }
}

export default router;