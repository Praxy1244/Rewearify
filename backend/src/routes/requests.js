import express from 'express';
import Request from '../models/Request.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { requestValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';
import { sendTemplateEmail } from '../utils/email.js';
import { checkNewAchievements } from '../utils/achievements.js';

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
      status,  // ✅ FIXED: Removed default value
      search
    } = req.query;

    // Build query
    let query = {};  // ✅ FIXED: Start with empty query
    
    // ✅ FIXED: Only filter by status if provided
    if (status) {
      query.status = status;
    }
    
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

// ==================== DONOR RESPONSE ENDPOINTS (Must be before /:id route) ====================

// @desc    Get pending requests for donor's donations
// @route   GET /api/requests/donor/pending
// @access  Private (Donor)
router.get('/donor/pending', protect, restrictTo('donor'), async (req, res) => {
  try {
    // Get all donations by this donor
    const donations = await Donation.find({ donor: req.user.id, status: 'approved' }).select('_id');
    const donationIds = donations.map(d => d._id);

    // Find requests for these donations where donor hasn't responded
    const requests = await Request.find({
      donation: { $in: donationIds },
      'donorResponse.status': 'pending',
      status: { $in: ['active', 'pending_donor'] }
    })
    .populate('donation', 'title images category quantity')
    .populate('requester', 'name profile.profilePicture organization location.city')
    .sort({ createdAt: -1 });

    return ok(res, { requests }, 'Pending requests retrieved successfully');
  } catch (error) {
    console.error('Get pending requests error:', error);
    return fail(res, 'Failed to get pending requests', 500);
  }
});

// @desc    Get general community requests (not linked to specific donations)
// @route   GET /api/requests/community
// @access  Public
router.get('/community', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      urgency,
      sortBy = 'urgency',
      sortOrder = 'desc'
    } = req.query;

    // Build query for GENERAL requests only (no specific donation)
    let query = { 
      status: 'active',
      donation: null  // Only general community requests
    };
    
    if (category) query.category = category;
    if (urgency) query.urgency = { $in: urgency.split(',') };

    // Sort by urgency first, then creation date
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'urgency') {
      sortObj['createdAt'] = -1; // Secondary sort by date
    }

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
    }, 'Community requests retrieved successfully');
  } catch (error) {
    console.error('Get community requests error:', error);
    return fail(res, 'Failed to get community requests', 500);
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
        requester: req.user.id,
        status: 'pending'  // ✅ FIXED: Always start as pending
      };

      // Create request
      const request = await Request.create(requestData);

      // Update user statistics
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'statistics.totalRequests': 1 }
      });

      // ✅ FIXED: Notify admin about new request for approval
      const admins = await User.find({ role: 'admin', status: 'active' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: 'new_donation_request',
          title: 'New Request Needs Approval 📋',
          message: `${req.user.organization?.name || req.user.name} submitted a new request "${request.title}"`,
          data: {
            requestId: request._id,
            actionUrl: `/admin/manage-donations?tab=requests`
          },
          channels: { inApp: true, email: false }
        });
      }

      return created(res, { request }, 'Request submitted successfully. Awaiting admin approval.');
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

      // ✅ FIXED: Check if admin is approving pending request
      const wasPending = request.status === 'pending';
      const isApproving = req.body.status === 'active' && req.user.role === 'admin';

      // Update request
      const updatedRequest = await Request.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('requester', 'name organization').populate('donation');

      // ✅ NEW: If admin just approved the request, trigger notifications and matching
      if (wasPending && isApproving) {
        // Notify requester
        await Notification.create({
          recipient: updatedRequest.requester._id,
          type: 'request_approved',
          title: 'Request Approved! ✅',
          message: `Your request "${updatedRequest.title}" has been approved and is now active.`,
          data: {
            requestId: updatedRequest._id,
            actionUrl: `/recipient/my-requests/${updatedRequest._id}`
          },
          channels: { inApp: true, email: true }
        });

        // If request is for a specific donation, notify the donor
        if (updatedRequest.donation) {
          const donation = await Donation.findById(updatedRequest.donation._id).populate('donor');
          
          if (donation && donation.status === 'approved' && !donation.acceptedBy) {
            // Update to pending_donor status
            updatedRequest.status = 'pending_donor';
            updatedRequest.donorResponse = {
              status: 'pending',
              respondedAt: null,
              respondedBy: null,
              acceptanceNote: '',
              rejectionReason: ''
            };
            await updatedRequest.save();

            // Notify donor
            await Notification.create({
              recipient: donation.donor._id,
              type: 'new_donation_request',
              title: 'New Request for Your Donation! 📦',
              message: `${updatedRequest.requester.organization?.name || updatedRequest.requester.name} has requested your donation "${donation.title}"`,
              data: {
                requestId: updatedRequest._id,
                donationId: donation._id,
                requesterName: updatedRequest.requester.name,
                actionUrl: `/donor/donation-requests`
              },
              channels: { inApp: true, email: true }
            });
          }
        } else {
          // General request - find matches and notify nearby donors
          try {
            await findPotentialMatches(updatedRequest._id);
          } catch (matchError) {
            console.error('Error finding matches:', matchError);
          }

          if (updatedRequest.urgency === 'high' || updatedRequest.urgency === 'critical') {
            await notifyNearbyDonors(updatedRequest);
          }
        }
      }

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

// ==================== DONOR RESPONSE ENDPOINTS CONTINUED ====================
// @desc    Donor accepts a request
// @route   POST /api/requests/:id/accept
// @access  Private (Donor)
router.post('/:id/accept', protect, restrictTo('donor'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check if the donor owns the donation
    if (!request.donation) {
      return fail(res, 'No donation linked to this request', 400);
    }

    if (request.donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to accept this request', 403);
    }

    // ✅ FIX: Update BOTH request AND donation status
    request.donorResponse = {
      status: 'accepted',
      respondedAt: new Date(),
      respondedBy: req.user.id,
      acceptanceNote: req.body.note || ''
    };
    request.status = 'accepted';

    await request.save();

    // ✅ NEW: Update donation status to accepted_by_ngo
    const donation = await Donation.findById(request.donation._id);
    if (donation) {
      donation.status = 'accepted_by_ngo';
      donation.acceptedBy = request.requester._id; // The NGO who made the request
      donation.acceptedAt = new Date();
      await donation.save();
      
      console.log(`✅ Donation ${donation._id} accepted by NGO ${request.requester._id}`);
    }

    // Notify recipient
    await Notification.create({
      recipient: request.requester._id,
      type: 'request_accepted',
      title: 'Request Accepted! 🎉',
      message: `${req.user.name} has accepted your request for "${request.donation.title}". They will schedule a pickup time soon.`,
      data: {
        requestId: request._id,
        donationId: request.donation._id,
        actionUrl: `/recipient/my-requests`
      },
      channels: { inApp: true, email: true }
    });

    return ok(res, { request }, 'Request accepted successfully. Please schedule pickup time.');
  } catch (error) {
    console.error('Accept request error:', error);
    return fail(res, 'Failed to accept request', 500);
  }
});

// @desc    Donor rejects a request
// @route   POST /api/requests/:id/reject
// @access  Private (Donor)
router.post('/:id/reject', protect, restrictTo('donor'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return fail(res, 'Rejection reason is required', 400);
    }

    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check if the donor owns the donation
    if (!request.donation || request.donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to reject this request', 403);
    }

    // Update request status
    request.donorResponse = {
      status: 'rejected',
      respondedAt: new Date(),
      respondedBy: req.user.id,
      rejectionReason: reason
    };
    request.status = 'rejected';

    await request.save();

    // Notify recipient
    await Notification.createAndSend({
      recipient: request.requester._id,
      type: 'request_rejected',
      title: 'Request Status Update',
      message: `Your request for "${request.donation.title}" was not accepted. Reason: ${reason}`,
      data: {
        requestId: request._id,
        donationId: request.donation._id,
        actionUrl: `/recipient/my-requests`
      },
      channels: { inApp: true, email: true }
    });

    return ok(res, { request }, 'Request rejected');
  } catch (error) {
    console.error('Reject request error:', error);
    return fail(res, 'Failed to reject request', 500);
  }
});

// @desc    Donor provides pickup/delivery details
// @route   POST /api/requests/:id/logistics
// @access  Private (Donor)
router.post('/:id/logistics', protect, restrictTo('donor'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check if the donor owns the donation
    if (!request.donation || request.donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to update logistics', 403);
    }

    // Check if request is accepted
    if (request.donorResponse?.status !== 'accepted') {
      return fail(res, 'Request must be accepted first', 400);
    }

    const { method, address, city, state, zipCode, contactPerson, contactPhone, preferredDate, preferredTimeSlot, specialInstructions } = req.body;

    if (!method || !['pickup', 'delivery'].includes(method)) {
      return fail(res, 'Invalid delivery method. Must be "pickup" or "delivery"', 400);
    }

    if (!address || !city || !contactPhone) {
      return fail(res, 'Address, city, and contact phone are required', 400);
    }

    // Update pickup/delivery details
    request.pickupDelivery = {
      method,
      address,
      city,
      state: state || request.donation.location.state,
      zipCode,
      contactPerson: contactPerson || req.user.name,
      contactPhone,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTimeSlot,
      specialInstructions
    };

    request.status = 'pickup_scheduled';

    await request.save();

    // Notify recipient with pickup/delivery details
    await Notification.createAndSend({
      recipient: request.requester._id,
      type: 'logistics_scheduled',
      title: method === 'pickup' ? 'Pickup Details Available' : 'Delivery Scheduled',
      message: `${req.user.name} has provided ${method} details for your request`,
      data: {
        requestId: request._id,
        method,
        address,
        contactPhone,
        actionUrl: `/recipient/my-requests/${request._id}`
      },
      channels: { inApp: true, email: true }
    });

    return ok(res, { request }, 'Logistics details updated successfully');
  } catch (error) {
    console.error('Update logistics error:', error);
    return fail(res, 'Failed to update logistics', 500);
  }
});

// @desc    Update request status (in_transit, delivered)
// @route   PUT /api/requests/:id/status
// @access  Private (Donor, Recipient, or Admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    if (!status) {
      return fail(res, 'Status is required', 400);
    }

    const validStatuses = ['in_transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return fail(res, 'Invalid status. Must be "in_transit" or "delivered"', 400);
    }

    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check authorization
    const isDonor = request.donation && request.donation.donor._id.toString() === req.user.id;
    const isRecipient = request.requester._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isRecipient && !isAdmin) {
      return fail(res, 'Not authorized to update this request status', 403);
    }

    // Update status
    request.status = status;

    if (status === 'delivered') {
      request.fulfillment = {
        ...request.fulfillment,
        deliveredAt: new Date(),
        deliveryConfirmedBy: req.user.id
      };
    }

    await request.save();

    // Notify relevant parties
    const notificationRecipients = [];
    if (!isDonor && request.donation) notificationRecipients.push(request.donation.donor._id);
    if (!isRecipient) notificationRecipients.push(request.requester._id);

    for (const recipientId of notificationRecipients) {
      await Notification.createAndSend({
        recipient: recipientId,
        type: 'status_update',
        title: 'Request Status Updated',
        message: `Request status updated to: ${status.replace('_', ' ')}${note ? `. Note: ${note}` : ''}`,
        data: {
          requestId: request._id,
          status,
          actionUrl: req.user.role === 'recipient' ? `/recipient/my-requests/${request._id}` : `/donor/my-donations`
        },
        channels: { inApp: true, email: false }
      });
    }

    return ok(res, { request }, 'Status updated successfully');
  } catch (error) {
    console.error('Update status error:', error);
    return fail(res, 'Failed to update status', 500);
  }
});

// @desc    Recipient submits feedback
// @route   POST /api/requests/:id/feedback
// @access  Private (Recipient)
router.post('/:id/feedback', protect, restrictTo('recipient'), async (req, res) => {
  try {
    const { rating, comment, photos, beneficiariesHelped, impactStory } = req.body;
    
    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check ownership
    if (request.requester._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to submit feedback for this request', 403);
    }

    // Check if delivered
    if (request.status !== 'delivered') {
      return fail(res, 'Can only submit feedback after delivery confirmation', 400);
    }

    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 'Valid rating (1-5) is required', 400);
    }

    // Update feedback
    request.fulfillment = {
      ...request.fulfillment,
      feedback: {
        rating,
        comment: comment || '',
        photos: photos || [],
        submittedAt: new Date()
      },
      impact: {
        beneficiariesHelped: beneficiariesHelped || 0,
        impactStory: impactStory || '',
        photos: photos || []
      }
    };

    await request.save();

    // 🎉 UPDATE DONOR STATISTICS AND TRIGGER CONGRATULATIONS
    if (request.donation && request.donation.donor) {
      const donor = await User.findById(request.donation.donor._id);
      
      if (donor) {
        // Calculate new average rating
        const currentTotalRating = donor.statistics.rating * donor.statistics.totalRatings;
        const newTotalRatings = donor.statistics.totalRatings + 1;
        const newAverageRating = (currentTotalRating + rating) / newTotalRatings;
        
        // Update donor statistics
        const updatedStats = {
          rating: parseFloat(newAverageRating.toFixed(2)),
          totalRatings: newTotalRatings,
          totalBeneficiariesHelped: donor.statistics.totalBeneficiariesHelped + (beneficiariesHelped || 0),
          completedDonations: donor.statistics.completedDonations + 1,
          totalDonations: donor.statistics.totalDonations
        };
        
        // Check for new achievements
        const newAchievements = checkNewAchievements(donor, updatedStats);
        
        // Update donor record
        donor.statistics = updatedStats;
        if (newAchievements.length > 0) {
          donor.achievements = [...(donor.achievements || []), ...newAchievements];
        }
        await donor.save();
        
        // Send congratulations notification (in-app)
        await Notification.createAndSend({
          recipient: donor._id,
          type: 'congratulations',
          title: '🎉 Congratulations! Your donation made an impact!',
          message: `${req.user.name} rated your donation ${rating}/5 stars${newAchievements.length > 0 ? ` and you've earned ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!` : '!'}`,
          data: {
            requestId: request._id,
            rating,
            beneficiariesHelped,
            newAchievements: newAchievements.length,
            actionUrl: `/donor/congratulations/${request._id}`
          },
          channels: { inApp: true, email: false }
        });
        
        // Send congratulations email
        try {
          await sendTemplateEmail(
            donor.email,
            'congratulations',
            {
              donorName: donor.name,
              recipientName: req.user.name,
              rating,
              comment: comment || '',
              beneficiariesHelped: beneficiariesHelped || 0,
              impactStory: impactStory || '',
              totalDonations: updatedStats.completedDonations,
              totalBeneficiaries: updatedStats.totalBeneficiariesHelped,
              newAchievements,
              requestId: request._id
            }
          );
          console.log(`✅ Congratulations email sent to donor: ${donor.email}`);
        } catch (emailError) {
          console.error('Failed to send congratulations email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    // Notify admin about feedback submission
    const admins = await User.find({ role: 'admin', status: 'active' });
    for (const admin of admins) {
      await Notification.createAndSend({
        recipient: admin._id,
        type: 'feedback_submitted',
        title: 'New Feedback Submitted',
        message: `Feedback received for request "${request.title}" - Rating: ${rating}/5`,
        data: {
          requestId: request._id,
          rating,
          actionUrl: `/admin/requests`
        },
        channels: { inApp: true, email: false }
      });
    }

    return ok(res, { request }, 'Feedback submitted successfully! Donor has been congratulated.');
  } catch (error) {
    console.error('Submit feedback error:', error);
    return fail(res, 'Failed to submit feedback', 500);
  }
});

// @desc    Admin marks request as completed
// @route   PUT /api/requests/:id/complete
// @access  Private (Admin)
router.put('/:id/complete', protect, restrictTo('admin'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('donation');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check if feedback is submitted
    if (!request.fulfillment?.feedback?.submittedAt) {
      return fail(res, 'Cannot complete request without feedback', 400);
    }

    // Update status
    request.status = 'fulfilled';
    request.fulfillment.completedAt = new Date();
    request.fulfillment.completedBy = req.user.id;

    await request.save();

    // Update donation status to completed if linked
    if (request.donation) {
      await Donation.findByIdAndUpdate(request.donation._id, {
        status: 'completed',
        'completion.completedAt': new Date(),
        'completion.completedBy': req.user.id
      });
    }

    // Notify donor and recipient
   // Notify donor and recipient
const notifications = [
  {
    recipient: request.requester._id,
    title: 'Request Completed! ✅',
    message: `Your request "${request.title}" has been marked as completed. Thank you for your feedback!`,
    data: {
      requestId: request._id,
      actionUrl: `/recipient/my-requests`
    }
  }
];

if (request.donation) {
  notifications.push({
    recipient: request.donation.donor._id,
    title: 'Donation Completed! 🎉',
    message: `Your donation "${request.donation.title}" has been successfully completed. Thank you for your generosity!`,
    data: {
      donationId: request.donation._id,
      requestId: request._id,
      actionUrl: `/donor/congratulations/${request._id}`
    }
  });
}

for (const notif of notifications) {
  await Notification.createAndSend({
    ...notif,
    type: notif.recipient.toString() === request.donation?.donor._id.toString() 
      ? 'donation_completed'
      : 'request_completed',
    data: notif.data,  // Use the data we already defined above
    channels: { inApp: true, email: true }
  });
}


    return ok(res, { request }, 'Request marked as completed');
  } catch (error) {
    console.error('Complete request error:', error);
    return fail(res, 'Failed to complete request', 500);
  }
});

// @desc    Get congratulations details for donor
// @route   GET /api/requests/:id/congratulations
// @access  Private (Donor)
router.get('/:id/congratulations', protect, restrictTo('donor'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('donation')
      .populate('requester', 'name profile.profilePicture organization');
    
    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    // Check if the donor owns the donation
    if (!request.donation || request.donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to view congratulations for this request', 403);
    }

    // Get donor details with stats
    const donor = await User.findById(req.user.id);
    
    // Prepare congratulations data
    const congratulationsData = {
      request: {
        id: request._id,
        title: request.title,
        category: request.category,
        quantity: request.quantity,
        status: request.status
      },
      recipient: {
        name: request.requester.name,
        profilePicture: request.requester.profile?.profilePicture?.url || '',
        organization: request.requester.organization?.name || ''
      },
      donation: {
        title: request.donation.title,
        images: request.donation.images || []
      },
      feedback: {
        rating: request.fulfillment?.feedback?.rating || 0,
        comment: request.fulfillment?.feedback?.comment || '',
        submittedAt: request.fulfillment?.feedback?.submittedAt || null
      },
      impact: {
        beneficiariesHelped: request.fulfillment?.impact?.beneficiariesHelped || 0,
        impactStory: request.fulfillment?.impact?.impactStory || '',
        photos: request.fulfillment?.impact?.photos || []
      },
      donorStats: {
        rating: donor.statistics?.rating || 0,
        totalRatings: donor.statistics?.totalRatings || 0,
        completedDonations: donor.statistics?.completedDonations || 0,
        totalBeneficiariesHelped: donor.statistics?.totalBeneficiariesHelped || 0
      },
      achievements: donor.achievements || []
    };

    return ok(res, congratulationsData, 'Congratulations data retrieved successfully');
  } catch (error) {
    console.error('Get congratulations error:', error);
    return fail(res, 'Failed to get congratulations data', 500);
  }
});

export default router;
