import express from 'express';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { donationValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';
import donationFSM from '../services/fsmService.js';
import donorMetricsService from '../services/donorMetricsService.js';
import mongoose from 'mongoose';

const router = express.Router();

// ==================== GENERAL ROUTES (NO PARAMS) ====================

// @desc    Get all donations (with filters)
// @route   GET /api/donations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      category, 
      condition, 
      city, 
      donor,
      acceptedBy,
      availableOnly, // ✅ NEW: Filter for browse items
      page = 1, 
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (donor) query.donor = donor;
    if (acceptedBy) query.acceptedBy = acceptedBy;
    
    // ✅ NEW: For browse items - only show approved donations that haven't been accepted yet
    if (availableOnly === 'true') {
      query.status = 'approved';
      query.acceptedBy = null; // Not yet accepted by any NGO
    }

    const skip = (page - 1) * limit;
    
    // ✅ ADD .select('+completion') to include completion field
    const donations = await Donation.find(query)
      .select('+completion')  // 👈 ADD THIS LINE
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Donation.countDocuments(query);

    return res.json({
      success: true,
      message: 'Donations retrieved successfully',
      data: donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get donations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching donations'
    });
  }
});


// @desc    Create new donation
// @route   POST /api/donations
// @access  Private (Donor or Admin)
router.post('/', 
  protect, 
  restrictTo('donor', 'admin'),
  donationValidations.create, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const donationData = {
        ...req.body,
        donor: req.user.id
      };

      // ✅ NEW: If this donation fulfills an NGO request, link them
      if (req.body.fulfillingRequest) {
        const linkedRequest = await Request.findById(req.body.fulfillingRequest);
        if (linkedRequest && linkedRequest.status === 'active') {
          donationData.fulfillingRequest = req.body.fulfillingRequest;
          // Auto-select the requesting NGO as preferred recipient
          donationData.preferences = {
            ...donationData.preferences,
            preferredRecipients: [linkedRequest.requester]
          };
          console.log(`✅ Donation linked to NGO request ${linkedRequest._id}`);
        }
      }

      // ==================== CALCULATE DONOR METRICS ====================
      console.log('📊 Calculating donor metrics...');
      const donorMetrics = await donorMetricsService.calculateDonorMetrics(req.user.id);

      // ==================== STEP 1: FRAUD DETECTION ====================
      console.log('🔍 Running fraud detection...');

      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      let fraudCheckResult = null;

      try {
        // ✅ Build donor_data object (historical metrics)
        const donor_data = {
          reliability_score: donorMetrics.DonorReliability,
          past_donations: donorMetrics.Past_Donations,
          flagged: donorMetrics.Flagged === 1,
          last_feedback: donorMetrics.Feedback_mean,
          fulfillment_rate: donorMetrics.Fulfillment_Rate,
          avg_quantity_claimed: donorMetrics.Avg_Quantity_Claimed,
          avg_quantity_received_ratio: donorMetrics.Avg_Quantity_Received_ratio,
          avg_fulfillment_delay: donorMetrics.Avg_Fulfillment_Delay,
          num_manual_rejects: donorMetrics.Num_ManualRejects
        };

        // ✅ Build donation_data object (current donation)
        const donation_data = {
          category: donationData.category,
          condition: donationData.condition === 'excellent' ? 'New' : donationData.condition,
          quantity: donationData.quantity,
          description: donationData.description,
          proof_provided: !!(donationData.images && donationData.images.length > 0)
        };

        console.log('🎯 Fraud check request:', {
          donor_data: {
            reliability: donor_data.reliability_score,
            past_donations: donor_data.past_donations
          },
          donation_data: {
            quantity: donation_data.quantity,
            condition: donation_data.condition
          }
        });

        // ✅ Send to AI service in correct format
        const fraudResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/check-fraud`, {
          donor_id: req.user.id,
          donation_data: donation_data,
          donor_data: donor_data,
          model_name: 'random_forest'
        }, { timeout: 5000 });

        if (fraudResponse.data && fraudResponse.data.success) {
          fraudCheckResult = fraudResponse.data;
          console.log(`✅ Fraud check complete:`);
          console.log(`   Risk Level: ${fraudCheckResult.risk_level}`);
          console.log(`   Confidence: ${(fraudCheckResult.confidence * 100).toFixed(1)}%`);
          console.log(`   Is Suspicious: ${fraudCheckResult.is_suspicious}`);
          
          // ✅ Save fraud results
          donationData.riskScore = fraudCheckResult.confidence;
          donationData.riskLevel = fraudCheckResult.risk_level;
          donationData.isFlagged = fraudCheckResult.is_suspicious;
          donationData.flagReason = fraudCheckResult.risk_factors ? fraudCheckResult.risk_factors.join(', ') : '';
          
          donationData.aiAnalysis = {
            ...donationData.aiAnalysis,
            fraudScore: fraudCheckResult.confidence,
            qualityScore: 1 - fraudCheckResult.confidence
          };
        }
      } catch (aiError) {
        console.error('⚠️ Fraud check failed (non-blocking):', aiError.message);
        if (aiError.response) {
          console.error('Response status:', aiError.response.status);
          console.error('Response data:', JSON.stringify(aiError.response.data, null, 2));
        }
      }

      // ==================== STEP 2: AI MATCHING ====================
      let aiMatches = [];
      if (donationData.location?.coordinates?.coordinates) {
        try {
          console.log('🔍 Running AI matching...');
          const [lng, lat] = donationData.location.coordinates.coordinates;
          
          const matchResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/match-donations`, {
            donation_id: "NEW",
            type: donationData.category,
            season: donationData.season || 'All Season',
            quantity: donationData.quantity,
            latitude: lat,
            longitude: lng,
            description: donationData.description,
            max_distance: donationData.availability?.deliveryRadius || 25
          }, { timeout: 5000 });

          if (matchResponse.data.success) {
            aiMatches = matchResponse.data.matches || [];
            console.log(`✅ Found ${aiMatches.length} AI matches`);
            
            // Store top matches in aiAnalysis
            donationData.aiAnalysis = {
              ...donationData.aiAnalysis,
              matchingTags: aiMatches.slice(0, 3).map(m => m.ngo_name || 'Unknown'),
              demandPrediction: aiMatches.length > 3 ? 'high' : aiMatches.length > 0 ? 'medium' : 'low'
            };
          }
        } catch (matchError) {
          console.error('⚠️ AI Matching failed (non-blocking):', matchError.message);
        }
      }

      // ==================== CREATE DONATION ====================
      console.log('📝 Creating donation...');
      const donation = await Donation.create(donationData);

      console.log('✅ Donation created:', {
        id: donation._id,
        riskScore: donation.riskScore,
        riskLevel: donation.riskLevel,
        aiMatches: aiMatches.length
      });

      // Auto-flag if suspicious
      if (fraudCheckResult && fraudCheckResult.is_suspicious) {
        console.log('🚨 High fraud risk detected - flagging donation');
        
        donation.isFlagged = true;
        donation.flagReason = fraudCheckResult.risk_factors ? fraudCheckResult.risk_factors.join(', ') : 'High fraud risk';
        
        try {
          await donationFSM.transition(
            donation,
            'flagged',
            {
              id: null,
              name: 'Fraud Detection AI',
              role: 'system'
            },
            {
              fraud_score: fraudCheckResult.confidence,
              risk_level: fraudCheckResult.risk_level,
              risk_factors: fraudCheckResult.risk_factors,
              automated: true
            }
          );
        } catch (fsmError) {
          console.error('FSM transition failed:', fsmError.message);
          donation.status = 'flagged';
        }
        
        await donation.save();

        // Notify admins about flagged donation
        const admins = await User.find({ role: 'admin', status: 'active' });
        const socketService = req.app.get('socketService');

        for (const admin of admins) {
          try {
            const notification = await Notification.create({
              recipient: admin._id,
              type: 'fraud_alert',
              title: '⚠️ Suspicious Donation Flagged',
              message: `Donation "${donation.title}" flagged for review. Risk score: ${(fraudCheckResult.confidence * 100).toFixed(0)}%`,
              data: {
                donationId: donation._id,
                donorId: req.user.id,
                donorName: req.user.name,
                fraudScore: fraudCheckResult.confidence,
                riskLevel: fraudCheckResult.risk_level,
                actionUrl: `/admin/donations/flagged`
              },
              channels: { inApp: true, email: true, push: false }
            });

            if (socketService) {
              socketService.sendToUser(admin._id.toString(), {
                _id: notification._id,
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                createdAt: notification.createdAt,
                read: false
              });
            }
          } catch (notifError) {
            console.error('Notification error:', notifError);
          }
        }

        return created(res, { 
          donation,
          fraud_check: fraudCheckResult,
          ai_matches: aiMatches,
          warning: 'Donation flagged for manual review due to suspicious activity'
        }, 'Donation submitted but flagged for review');
      }

      // Update user statistics
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'statistics.totalDonations': 1 }
      });

      // Notify admins (normal flow)
      const admins = await User.find({ role: 'admin', status: 'active' });
      const socketService = req.app.get('socketService');

      for (const admin of admins) {
        try {
          const notification = await Notification.create({
            recipient: admin._id,
            type: 'new_donation_pending',
            title: 'New Donation Pending Review',
            message: `New donation "${donation.title}" submitted by ${req.user.name}`,
            data: {
              donationId: donation._id,
              donorId: req.user.id,
              donorName: req.user.name,
              actionUrl: `/admin/donations`
            },
            channels: { inApp: true, email: false, push: false }
          });

          if (socketService) {
            socketService.sendToUser(admin._id.toString(), {
              _id: notification._id,
              id: notification._id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              createdAt: notification.createdAt,
              read: false
            });
          }
        } catch (error) {
          console.error(`Error sending notification to admin ${admin._id}:`, error);
        }
      }

      return created(res, { 
        donation,
        fraud_check: fraudCheckResult,
        ai_matches: aiMatches
      }, 'Donation created successfully. Pending admin approval.');
      
    } catch (error) {
      console.error('Create donation error:', error);
      return fail(res, 'Failed to create donation', 500);
    }
  }
);
// @desc    Debug: Get accepted donations for current user
// @route   GET /api/donations/debug/my-accepted
// @access  Private (Recipient)
router.get('/debug/my-accepted', protect, restrictTo('recipient'), async (req, res) => {
  try {
    console.log('🔍 Debug: Checking accepted donations for user:', req.user.id);
    
    // Find ALL donations with acceptedBy field
    const allWithAcceptedBy = await Donation.find({ 
      acceptedBy: { $exists: true, $ne: null } 
    })
    .populate('acceptedBy', 'name organization email')
    .select('_id title status acceptedBy acceptedAt')
    .lean();
    
    console.log(`📊 Total donations with acceptedBy: ${allWithAcceptedBy.length}`);
    
    // Find donations accepted by THIS user
    const myAccepted = await Donation.find({
      acceptedBy: req.user.id
    })
    .populate('acceptedBy', 'name organization email')
    .lean();
    
    console.log(`📊 Donations accepted by me: ${myAccepted.length}`);
    
    // Alternative query
    const myAcceptedAlt = await Donation.find({
      status: { $in: ['accepted_by_ngo', 'pickup_scheduled', 'in_transit', 'delivered', 'fulfilled'] }
    })
    .populate('acceptedBy', 'name organization email')
    .lean();
    
    const filtered = myAcceptedAlt.filter(d => {
      const acceptedById = d.acceptedBy?._id?.toString() || d.acceptedBy?.toString();
      const match = acceptedById === req.user.id.toString();
      console.log(`Donation ${d._id}: acceptedBy=${acceptedById}, user=${req.user.id}, match=${match}`);
      return match;
    });
    
    return res.json({
      success: true,
      data: {
        currentUserId: req.user.id,
        allWithAcceptedBy: allWithAcceptedBy.length,
        allWithAcceptedByData: allWithAcceptedBy,
        myAcceptedDirect: myAccepted.length,
        myAcceptedDirectData: myAccepted,
        myAcceptedFiltered: filtered.length,
        myAcceptedFilteredData: filtered
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return fail(res, 'Debug failed', 500);
  }
});

// ==================== SPECIAL ROUTES (BEFORE /:id) ====================

// @desc    Get flagged donations
// @route   GET /api/donations/flagged
// @access  Private (Admin)
router.get('/flagged', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const flaggedDonations = await Donation.find({ 
      $or: [
        { status: 'flagged' },
        { isFlagged: true }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Donation.countDocuments({ 
      $or: [
        { status: 'flagged' },
        { isFlagged: true }
      ]
    });

    return res.json({
      success: true,
      message: 'Flagged donations retrieved successfully',
      data: flaggedDonations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get flagged donations error:', error);
    return fail(res, 'Failed to get flagged donations', 500);
  }
});

// @desc    Get fraud analytics
// @route   GET /api/donations/analytics/fraud
// @access  Private (Admin)
router.get('/analytics/fraud', protect, restrictTo('admin'), async (req, res) => {
  try {
    const totalFlagged = await Donation.countDocuments({ isFlagged: true });
    const totalDonations = await Donation.countDocuments();
    
    const recentFlagged = await Donation.find({ isFlagged: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title donor riskScore flagReason createdAt')
      .lean();

    return ok(res, {
      total_flagged: totalFlagged,
      total_donations: totalDonations,
      flag_rate: totalDonations > 0 ? ((totalFlagged / totalDonations) * 100).toFixed(2) + '%' : '0%',
      recent_flagged: recentFlagged
    }, 'Fraud analytics retrieved successfully');
  } catch (error) {
    console.error('Get fraud analytics error:', error);
    return fail(res, 'Failed to get fraud analytics', 500);
  }
});

// @desc    Get user's donations
// @route   GET /api/donations/user/:userId
// @access  Private (Owner or Admin)
router.get('/user/:userId', protect, adminOrOwner('userId'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { donor: req.params.userId };
    if (status) query.status = status;

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    return paginated(res, donations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'User donations retrieved successfully');
  } catch (error) {
    console.error('Get user donations error:', error);
    return fail(res, 'Failed to get user donations', 500);
  }
});

// ==================== 🆕 NEW WORKFLOW ENDPOINTS ====================

// @desc    Admin approves donation and notifies targeted NGO
// @route   PUT /api/donations/:id/admin-approve
// @access  Private (Admin only)
router.put('/:id/admin-approve', protect, restrictTo('admin'), async (req, res) => {
  try {
    console.log(`🔍 Admin ${req.user.name} attempting to approve donation ${req.params.id}`);

    // ✅ FIX: Find without populate (the model pre-hook will handle it)
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      console.log(`❌ Donation ${req.params.id} not found`);
      return fail(res, 'Donation not found', 404);
    }

    console.log(`📋 Current donation status: ${donation.status}`);
    console.log(`📋 Is flagged: ${donation.isFlagged}`);
    console.log(`📋 Preferred recipients count:`, donation.preferences?.preferredRecipients?.length || 0);

    // ✅ Check if donation is in a valid state for approval
    const validStates = ['pending', 'flagged'];
    if (!validStates.includes(donation.status)) {
      console.log(`❌ Cannot approve donation with status: ${donation.status}`);
      return fail(res, `Cannot approve donation with status "${donation.status}". Must be pending or flagged.`, 400);
    }

    // ✅ FIX: Update using the model method to avoid conflicts
    donation.status = 'approved';
    donation.approvedBy = req.user.id;
    donation.approvedAt = new Date();
    
    // ✅ Update moderation fields as well
    donation.moderation = donation.moderation || {};
    donation.moderation.approvedBy = req.user.id;
    donation.moderation.approvedAt = new Date();
    
    // Clear flag if it was flagged
    if (donation.isFlagged) {
      donation.isFlagged = false;
      donation.flagReason = 'Approved by admin after review';
    }
    
    await donation.save();

    console.log(`✅ Donation ${donation._id} approved by admin ${req.user.name}`);

    const socketService = req.app.get('socketService');

    // ✅ If donor selected a specific NGO, notify them
    if (donation.preferences?.preferredRecipients && 
        donation.preferences.preferredRecipients.length > 0) {
      
      const targetNGOId = donation.preferences.preferredRecipients[0];
      
      console.log(`📧 Fetching NGO details for ID: ${targetNGOId}`);
      
      try {
        // ✅ FIX: Fetch NGO separately instead of relying on populate
        const targetNGO = await User.findById(targetNGOId).select('name email organization location');
        
        if (targetNGO) {
          console.log(`📧 Notifying targeted NGO: ${targetNGO.organization?.name || targetNGO.name}`);
          
          // Create notification for NGO
          const ngoNotification = await Notification.create({
            recipient: targetNGO._id,
            type: 'donation_offer',
            title: '🎁 New Donation Offer',
            message: `A donor has offered you: "${donation.title}". Please review and accept.`,
            data: {
              donationId: donation._id,
              donorId: donation.donor._id || donation.donor,
              donorName: donation.donor.name || 'Unknown Donor',
              requiresAcceptance: true,
              actionUrl: `/recipient/donations/${donation._id}`
            },
            channels: { inApp: true, email: true, push: false }
          });

          // Send real-time notification via socket
          if (socketService) {
            socketService.sendToUser(targetNGO._id.toString(), {
              _id: ngoNotification._id,
              type: ngoNotification.type,
              title: ngoNotification.title,
              message: ngoNotification.message,
              data: ngoNotification.data,
              createdAt: ngoNotification.createdAt,
              read: false
            });
          }

          console.log(`✅ Notification sent to NGO ${targetNGO._id}`);
        } else {
          console.log(`⚠️ Targeted NGO not found with ID: ${targetNGOId}`);
        }
      } catch (ngoFetchError) {
        console.error(`⚠️ Failed to fetch or notify NGO:`, ngoFetchError.message);
        // Don't fail the approval if NGO notification fails
      }
    } else {
      console.log(`ℹ️ No preferred recipients specified - donation is public`);
    }

    // Notify donor that donation was approved
    try {
      const donorId = donation.donor._id || donation.donor;
      
      const donorNotification = await Notification.create({
        recipient: donorId,
        type: 'donation_approved',
        title: '✅ Donation Approved',
        message: `Your donation "${donation.title}" has been approved by admin.`,
        data: {
          donationId: donation._id,
          actionUrl: `/donor/my-donations/${donation._id}`
        },
        channels: { inApp: true, email: false, push: false }
      });

      if (socketService) {
        socketService.sendToUser(donorId.toString(), {
          _id: donorNotification._id,
          type: donorNotification.type,
          title: donorNotification.title,
          message: donorNotification.message,
          data: donorNotification.data,
          createdAt: donorNotification.createdAt,
          read: false
        });
      }
      
      console.log(`✅ Donor notification sent to ${donorId}`);
    } catch (donorNotifError) {
      console.error(`⚠️ Failed to notify donor:`, donorNotifError.message);
      // Don't fail the approval if notification fails
    }

    // ✅ Reload donation with populated fields for response
    const populatedDonation = await Donation.findById(donation._id);

    return ok(res, { 
      donation: populatedDonation,
      notifiedNGO: donation.preferences?.preferredRecipients?.[0] || null
    }, 'Donation approved successfully');

  } catch (error) {
    console.error('❌ Admin approval error:', error);
    console.error('Error stack:', error.stack);
    return fail(res, `Server error during approval: ${error.message}`, 500);
  }
});

// @desc    NGO accepts donation offer
// @route   PUT /api/donations/:id/ngo-accept
// @access  Private (Recipient/NGO only)
router.put('/:id/ngo-accept', protect, restrictTo('recipient'), async (req, res) => {
  try {
    console.log(`🔍 NGO ${req.user.organization?.name} (ID: ${req.user.id}) attempting to accept donation ${req.params.id}`);

    // Find donation first
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone location');

    if (!donation) {
      console.log(`❌ Donation ${req.params.id} not found`);
      return fail(res, 'Donation not found', 404);
    }

    console.log(`📋 Donation status: ${donation.status}`);
    console.log(`📋 Preferred recipients:`, donation.preferences?.preferredRecipients);

    // Check if donation is approved
    if (donation.status !== 'approved') {
      return fail(res, 'Donation must be approved first', 400);
    }

    // ✅ FIX: Better authorization check
    let isAuthorized = false;
    
    if (donation.preferences?.preferredRecipients && 
        donation.preferences.preferredRecipients.length > 0) {
      // If there are preferred recipients, check if current user is one of them
      const userIdStr = req.user.id.toString();
      
      isAuthorized = donation.preferences.preferredRecipients.some(recipient => {
        // Handle both populated objects and plain IDs
        const recipientIdStr = (recipient._id || recipient.id || recipient).toString();
        console.log(`   Comparing: ${recipientIdStr} === ${userIdStr} -> ${recipientIdStr === userIdStr}`);
        return recipientIdStr === userIdStr;
      });
      
      console.log(`📋 Checking against preferred recipients. Authorized: ${isAuthorized}`);
    } else {
      // If no preferred recipients, any NGO can accept (open donation)
      isAuthorized = true;
      console.log(`📋 No preferred recipients - open to all NGOs. Authorized: true`);
    }

    if (!isAuthorized) {
      console.log(`❌ User ${req.user.id} not authorized for donation ${donation._id}`);
      return fail(res, 'You are not authorized to accept this donation', 403);
    }

    // Check if already accepted
    if (donation.acceptedBy) {
      return fail(res, 'Donation already accepted by another NGO', 400);
    }

    // ✅ Update donation
    donation.status = 'accepted_by_ngo';
    donation.acceptedBy = req.user.id;
    donation.acceptedAt = new Date();
    
    await donation.save();

    console.log(`✅ NGO ${req.user.organization?.name} accepted donation ${donation._id}`);
    console.log(`✅ AcceptedBy set to: ${donation.acceptedBy}`);

    // Reload with populated fields
    await donation.populate('acceptedBy', 'name organization email phone');

    // ✅ NEW: Create a Request to track this accepted donation
    try {
      const trackingRequest = await Request.create({
        requester: req.user.id,
        title: `Accepted: ${donation.title}`,
        description: `Tracking request for accepted donation offer`,
        category: donation.category,
        subcategory: donation.subcategory || 'Other',
        urgency: 'medium',
        quantity: donation.quantity,
        sizes: donation.sizes || [{ size: 'Various', quantity: donation.quantity }],
        condition: {
          acceptable: [donation.condition],
          minimum: donation.condition
        },
        beneficiaries: {
          count: donation.quantity,
          ageGroup: 'mixed',
          gender: 'mixed'
        },
        location: req.user.location || {
          address: 'Not specified',
          city: 'Not specified',
          state: 'Not specified',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [0, 0] }
        },
        timeline: {
          neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          flexible: true
        },
        logistics: {
          canPickup: true,
          pickupRadius: 25,
          needsDelivery: false,
          hasTransport: false
        },
        donation: donation._id,
        status: 'accepted',
        donorResponse: {
          status: 'accepted',
          respondedAt: new Date(),
          respondedBy: donation.donor._id,
          acceptanceNote: 'Donation offer accepted by NGO'
        }
      });

      console.log(`✅ Created tracking request ${trackingRequest._id} for accepted donation`);
    } catch (requestError) {
      console.error('⚠️ Failed to create tracking request:', requestError);
      // Don't fail the acceptance if tracking request creation fails
    }

    const socketService = req.app.get('socketService');

    // Notify donor that NGO accepted
    try {
      const donorNotification = await Notification.create({
        recipient: donation.donor._id,
        type: 'ngo_accepted',
        title: '🎉 NGO Accepted Your Donation',
        message: `${req.user.organization?.name || 'An NGO'} accepted your donation: "${donation.title}". Please schedule a pickup.`,
        data: {
          donationId: donation._id,
          ngoId: req.user.id,
          ngoName: req.user.organization?.name,
          nextStep: 'schedule_pickup',
          actionUrl: `/donor/donations/${donation._id}/schedule-pickup`
        },
        channels: { inApp: true, email: true, push: false }
      });

      if (socketService) {
        socketService.sendToUser(donation.donor._id.toString(), {
          _id: donorNotification._id,
          type: donorNotification.type,
          title: donorNotification.title,
          message: donorNotification.message,
          data: donorNotification.data,
          createdAt: donorNotification.createdAt,
          read: false
        });
      }
    } catch (notifError) {
      console.error('❌ Failed to send notification:', notifError);
    }

    return ok(res, { 
      donation,
      donorInfo: {
        name: donation.donor.name,
        email: donation.donor.email,
        phone: donation.donor.phone,
        address: donation.location?.address
      }
    }, 'Donation accepted successfully. Donor will schedule pickup.');

  } catch (error) {
    console.error('❌ NGO acceptance error:', error);
    console.error('Error stack:', error.stack);
    return fail(res, 'Server error during acceptance', 500);
  }
});


// @desc    Donor schedules pickup after NGO acceptance
// @route   PUT /api/donations/:id/schedule-pickup
// @access  Private (Donor only)
router.put('/:id/schedule-pickup', protect, restrictTo('donor'), async (req, res) => {
  try {
    const { pickupDate, pickupTime, specialInstructions } = req.body;

    console.log(`📅 Donor ${req.user.name} (ID: ${req.user.id}) scheduling pickup for donation ${req.params.id}`);

    // Validate required fields
    if (!pickupDate || !pickupTime) {
      return fail(res, 'Pickup date and time are required', 400);
    }

    // Find donation WITHOUT populating donor first (to check ownership)
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      console.log(`❌ Donation ${req.params.id} not found`);
      return fail(res, 'Donation not found', 404);
    }

    // ✅ FIX: Better donor ID comparison
    const donorIdStr = (donation.donor._id || donation.donor).toString();
    const userIdStr = req.user.id.toString();
    
    console.log(`🔍 Comparing donor ID: ${donorIdStr} with user ID: ${userIdStr}`);

    if (donorIdStr !== userIdStr) {
      console.log(`❌ User ${userIdStr} not authorized for donation ${donation._id} (owned by ${donorIdStr})`);
      return fail(res, 'Only the donor can schedule pickup', 403);
    }

    // Check if NGO has accepted
    if (donation.status !== 'accepted_by_ngo' && donation.status !== 'pickup_scheduled') {
      return fail(res, 'NGO must accept the donation first', 400);
    }

    // Update donation with pickup schedule
    donation.pickupSchedule = {
      date: pickupDate,
      time: pickupTime,
      instructions: specialInstructions || '',
      scheduledAt: new Date()
    };
    
    // Only change status if it's currently accepted_by_ngo
    if (donation.status === 'accepted_by_ngo') {
      donation.status = 'pickup_scheduled';
    }
    
    await donation.save();

    console.log(`✅ Pickup scheduled: ${pickupDate} at ${pickupTime}`);

    // ✅ NEW: Update the linked Request status to 'pickup_scheduled'
    try {
      const linkedRequest = await Request.findOne({
        donation: donation._id,
        requester: donation.acceptedBy,
        status: 'accepted'
      });

      if (linkedRequest) {
        linkedRequest.status = 'pickup_scheduled';
        linkedRequest.pickupDelivery = {
          method: 'pickup',
          preferredDate: pickupDate,
          preferredTimeSlot: pickupTime,
          specialInstructions: specialInstructions || '',
          scheduledAt: new Date()
        };
        await linkedRequest.save();
        
        console.log(`✅ Request ${linkedRequest._id} status updated to pickup_scheduled`);
      } else {
        console.log(`⚠️ No linked request found for donation ${donation._id}`);
      }
    } catch (requestUpdateError) {
      console.error('⚠️ Failed to update request status:', requestUpdateError);
      // Don't fail the pickup scheduling if request update fails
    }

    // Now populate for response
    await donation.populate('acceptedBy', 'name organization email phone');

    const socketService = req.app.get('socketService');

    // Notify NGO about scheduled pickup
    try {
      const ngoNotification = await Notification.create({
        recipient: donation.acceptedBy._id,
        type: 'pickup_scheduled',
        title: '📅 Pickup Scheduled',
        message: `Pickup scheduled for "${donation.title}" on ${pickupDate} at ${pickupTime}`,
        data: {
          donationId: donation._id,
          pickupDate,
          pickupTime,
          address: donation.location?.address,
          specialInstructions,
          donorPhone: req.user.phone,
          actionUrl: `/recipient/my-requests`
        },
        channels: { inApp: true, email: true, push: false }
      });

      if (socketService) {
        socketService.sendToUser(donation.acceptedBy._id.toString(), {
          _id: ngoNotification._id,
          type: ngoNotification.type,
          title: ngoNotification.title,
          message: ngoNotification.message,
          data: ngoNotification.data,
          createdAt: ngoNotification.createdAt,
          read: false
        });
      }
    } catch (notifError) {
      console.error('❌ Failed to send notification to NGO:', notifError);
      // Don't fail the scheduling if notification fails
    }

    return ok(res, { 
      donation,
      pickupDetails: {
        date: pickupDate,
        time: pickupTime,
        instructions: specialInstructions,
        ngoContact: {
          name: donation.acceptedBy?.organization?.name || donation.acceptedBy?.name,
          email: donation.acceptedBy?.email,
          phone: donation.acceptedBy?.phone
        }
      }
    }, 'Pickup scheduled successfully. NGO has been notified.');

  } catch (error) {
    console.error('❌ Pickup scheduling error:', error);
    console.error('Error stack:', error.stack);
    return fail(res, 'Server error during pickup scheduling', 500);
  }
});

// @desc    Update donation status (for NGO workflow: in_transit, delivered)
// @route   PUT /api/donations/:id/update-status
// @access  Private (Recipient/NGO only)
router.put('/:id/update-status', protect, restrictTo('recipient'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return fail(res, 'Status is required', 400);
    }

    console.log(`📝 NGO ${req.user.organization?.name} updating donation ${req.params.id} to ${status}`);

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('acceptedBy', 'name organization email phone');

    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check if this NGO accepted the donation
    const acceptedByIdStr = (donation.acceptedBy?._id || donation.acceptedBy)?.toString();
    const userIdStr = req.user.id.toString();

    if (acceptedByIdStr !== userIdStr) {
      return fail(res, 'Only the NGO that accepted can update status', 403);
    }

    // Update status based on the requested change
    const oldStatus = donation.status;
    donation.status = status;

    // Set timestamps based on status
    if (status === 'in_transit' && !donation.pickedUpAt) {
      donation.pickedUpAt = new Date();
    } else if (status === 'delivered' && !donation.deliveredAt) {
      donation.deliveredAt = new Date();
    }

    if (notes) {
      donation.deliveryNotes = notes;
    }

    await donation.save();

    console.log(`✅ Donation ${donation._id} status changed: ${oldStatus} → ${status}`);

    // ✅ NEW: Update linked Request status
    try {
      const linkedRequest = await Request.findOne({
        donation: donation._id,
        requester: req.user.id
      });

      if (linkedRequest) {
        linkedRequest.status = status;
        
        if (status === 'delivered') {
          linkedRequest.fulfillment = {
            ...linkedRequest.fulfillment,
            deliveredAt: new Date(),
            deliveryConfirmedBy: req.user.id
          };
        }
        
        await linkedRequest.save();
        console.log(`✅ Request ${linkedRequest._id} status updated to ${status}`);
      }
    } catch (requestUpdateError) {
      console.error('⚠️ Failed to update request status:', requestUpdateError);
    }

    // Notify donor about status change
    try {
      const socketService = req.app.get('socketService');
      
      let notificationData = {
        recipient: donation.donor._id || donation.donor,
        data: {
          donationId: donation._id,
          ngoName: req.user.organization?.name || req.user.name,
          actionUrl: `/donor/requests`
        },
        channels: { inApp: true, email: false, push: false }
      };

      // Customize notification based on status
      if (status === 'in_transit') {
        notificationData.type = 'donation_picked_up';
        notificationData.title = '🚚 Donation Picked Up';
        notificationData.message = `${req.user.organization?.name || 'The NGO'} has picked up your donation: "${donation.title}"`;
      } else if (status === 'delivered') {
        notificationData.type = 'donation_delivered';
        notificationData.title = '✅ Donation Delivered';
        notificationData.message = `Your donation "${donation.title}" has been successfully delivered`;
        notificationData.channels.email = true; // Send email for delivered
      }

      const donorNotification = await Notification.create(notificationData);

      if (socketService) {
        socketService.sendToUser((donation.donor._id || donation.donor).toString(), {
          _id: donorNotification._id,
          type: donorNotification.type,
          title: donorNotification.title,
          message: donorNotification.message,
          data: donorNotification.data,
          createdAt: donorNotification.createdAt,
          read: false
        });
      }
    } catch (notifError) {
      console.error('Failed to notify donor:', notifError);
    }

    return ok(res, { donation }, `Donation status updated to ${status} successfully`);

  } catch (error) {
    console.error('Update status error:', error);
    return fail(res, 'Server error during status update', 500);
  }
});

// @desc    NGO submits feedback after delivery
// @route   PUT /api/donations/:id/feedback
// @access  Private (Recipient/NGO only)
router.put('/:id/feedback', protect, restrictTo('recipient'), async (req, res) => {
  try {
    const { rating, comment, beneficiariesHelped, impactStory } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 'Valid rating (1-5) is required', 400);
    }

    console.log(`⭐ NGO ${req.user.organization?.name} submitting feedback for donation ${req.params.id}`);

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email')
      .populate('acceptedBy', 'name organization email');

    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check if this NGO accepted the donation
    const acceptedByIdStr = (donation.acceptedBy?._id || donation.acceptedBy)?.toString();
    const userIdStr = req.user.id.toString();

    if (acceptedByIdStr !== userIdStr) {
      return fail(res, 'Only the NGO that accepted can provide feedback', 403);
    }

    // Check if donation is delivered
    if (donation.status !== 'delivered') {
      return fail(res, 'Donation must be delivered before submitting feedback', 400);
    }

    // ✅ FIX: Save feedback under completion object
    if (!donation.completion) {
      donation.completion = {};
    }

    donation.completion.feedback = {
      rating: parseInt(rating),
      comment: comment || ''
    };

    // ✅ Store additional impact data at root level (or you can add to model)
    donation.beneficiariesHelped = beneficiariesHelped ? parseInt(beneficiariesHelped) : 0;
    donation.impactStory = impactStory || '';
    
    // Keep status as 'delivered'
    await donation.save();

    console.log(`✅ Feedback submitted: ${rating}⭐`);

    // ✅ NEW: Update linked Request with feedback
    try {
      const linkedRequest = await Request.findOne({
        donation: donation._id,
        requester: req.user.id
      });

      if (linkedRequest) {
        linkedRequest.fulfillment = {
          ...linkedRequest.fulfillment,
          feedback: {
            rating: parseInt(rating),
            comment: comment || '',
            submittedAt: new Date()
          },
          impact: {
            beneficiariesHelped: beneficiariesHelped ? parseInt(beneficiariesHelped) : 0,
            impactStory: impactStory || ''
          }
        };
        await linkedRequest.save();
        console.log(`✅ Request ${linkedRequest._id} feedback updated`);
      }
    } catch (requestUpdateError) {
      console.error('⚠️ Failed to update request feedback:', requestUpdateError);
    }

    // Notify admins about feedback submission
    try {
      const admins = await User.find({ role: 'admin', status: 'active' });
      const socketService = req.app.get('socketService');

      for (const admin of admins) {
        const adminNotification = await Notification.create({
          recipient: admin._id,
          type: 'feedback_submitted',
          title: '⭐ Donation Feedback Received',
          message: `${req.user.organization?.name || req.user.name} submitted feedback (${rating}⭐) for donation "${donation.title}"`,
          data: {
            donationId: donation._id,
            rating,
            ngoId: req.user.id,
            ngoName: req.user.organization?.name || req.user.name,
            actionUrl: `/admin/donations/${donation._id}`
          },
          channels: { inApp: true, email: false, push: false }
        });

        if (socketService) {
          socketService.sendToUser(admin._id.toString(), {
            _id: adminNotification._id,
            type: adminNotification.type,
            title: adminNotification.title,
            message: adminNotification.message,
            data: adminNotification.data,
            createdAt: adminNotification.createdAt,
            read: false
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to notify admins:', notifError);
    }

    // Notify donor about the feedback
    try {
      const socketService = req.app.get('socketService');
      
      const donorNotification = await Notification.create({
        recipient: donation.donor._id || donation.donor,
        type: 'feedback_received',
        title: '⭐ Feedback Received',
        message: `${req.user.organization?.name || 'The NGO'} has submitted feedback (${rating}⭐) for your donation "${donation.title}"`,
        data: {
          donationId: donation._id,
          rating,
          actionUrl: `/donor/requests`
        },
        channels: { inApp: true, email: false, push: false }
      });

      if (socketService) {
        socketService.sendToUser((donation.donor._id || donation.donor).toString(), {
          _id: donorNotification._id,
          type: donorNotification.type,
          title: donorNotification.title,
          message: donorNotification.message,
          data: donorNotification.data,
          createdAt: donorNotification.createdAt,
          read: false
        });
      }
    } catch (donorNotifError) {
      console.error('Failed to notify donor:', donorNotifError);
    }

    return ok(res, { 
      donation,
      feedback: donation.completion.feedback 
    }, 'Feedback submitted successfully. Admin will review and complete the donation.');

  } catch (error) {
    console.error('Submit feedback error:', error);
    return fail(res, 'Server error during feedback submission', 500);
  }
});


// @desc    Admin marks donation as completed after reviewing feedback
// @route   PUT /api/donations/:id/mark-completed
// @access  Private (Admin only)
router.put('/:id/mark-completed', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    console.log(`🎯 Admin marking donation ${req.params.id} as completed`);

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email')
      .populate('acceptedBy', 'name organization email');

    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check if donation is delivered
    if (donation.status !== 'delivered') {
      return fail(res, 'Only delivered donations can be marked as completed', 400);
    }

    // ✅ FIX: Check completion.feedback instead of just feedback
    if (!donation.completion?.feedback?.rating) {
      return fail(res, 'Feedback must be submitted before marking as completed', 400);
    }

    // Update to completed status
    donation.status = 'completed';
    donation.completedAt = new Date();
    
    // ✅ FIX: Update completion object
    if (!donation.completion) {
      donation.completion = {};
    }
    donation.completion.completedAt = new Date();
    donation.completion.completedBy = req.user.id;

    // Add to state history (FSM)
    donation.state_history.push({
      from_state: 'delivered',
      to_state: 'completed',
      action: 'admin_complete',
      actor: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      timestamp: new Date(),
      metadata: {
        adminNotes: adminNotes || '',
        feedbackRating: donation.completion.feedback.rating
      }
    });

    await donation.save();

    console.log(`✅ Donation ${donation._id} marked as completed`);

    // Send congratulations notification to donor
    try {
      const socketService = req.app.get('socketService');
      
      const donorNotification = await Notification.create({
        recipient: donation.donor._id || donation.donor,
        type: 'donation_completed',
        title: '🎉 Donation Completed!',
        message: `Congratulations! Your donation "${donation.title}" has been successfully delivered and the recipient has provided positive feedback (${donation.completion.feedback.rating}⭐). Thank you for making a difference!`,
        data: {
          donationId: donation._id,
          rating: donation.completion.feedback.rating,
          actionUrl: `/donor/donations/${donation._id}`
        },
        channels: { inApp: true, email: true, push: false }
      });

      if (socketService) {
        socketService.sendToUser((donation.donor._id || donation.donor).toString(), {
          _id: donorNotification._id,
          type: donorNotification.type,
          title: donorNotification.title,
          message: donorNotification.message,
          data: donorNotification.data,
          createdAt: donorNotification.createdAt,
          read: false
        });
      }

      console.log('📨 Congratulations notification sent to donor');
    } catch (notifError) {
      console.error('Failed to notify donor:', notifError);
    }

    // Update donor and NGO statistics
    try {
      // Update donor stats
      await User.findByIdAndUpdate(donation.donor._id || donation.donor, {
        $inc: {
          'statistics.completedDonations': 1,
          'statistics.totalBeneficiariesHelped': donation.beneficiariesHelped || 0
        }
      });

      // Update NGO stats
      if (donation.acceptedBy) {
        await User.findByIdAndUpdate(donation.acceptedBy._id || donation.acceptedBy, {
          $inc: {
            'statistics.totalRatings': 1
          },
          $set: {
            // Calculate new average rating (simplified - you can make this more accurate)
            'statistics.rating': donation.completion.feedback.rating
          }
        });
      }

      console.log('📊 Statistics updated for donor and NGO');
    } catch (statsError) {
      console.error('Failed to update statistics:', statsError);
    }

    return ok(res, { donation }, 'Donation marked as completed successfully');

  } catch (error) {
    console.error('Mark completed error:', error);
    return fail(res, 'Server error while marking donation as completed', 500);
  }
});


// ==================== DYNAMIC ID ROUTES (AFTER SPECIAL ROUTES) ====================

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email profile organization location statistics')
      .populate('preferences.preferredRecipients', 'name organization email location')
      .populate('acceptedBy', 'name organization email phone');

    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Increment view count if not the owner
    if (!req.user || req.user.id !== donation.donor._id.toString()) {
      await donation.incrementViews();
    }

    return ok(res, { donation }, 'Donation retrieved successfully');
  } catch (error) {
    console.error('Get donation error:', error);
    return fail(res, 'Failed to get donation', 500);
  }
});

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Owner or Admin)
router.put('/:id', 
  protect, 
  donationValidations.update, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id);
      
      if (!donation) {
        return fail(res, 'Donation not found', 404);
      }

      // Check ownership or admin
      if (req.user.role !== 'admin' && donation.donor._id.toString() !== req.user.id) {
        return fail(res, 'Not authorized to update this donation', 403);
      }

      // Only allow updates if donation is in draft or pending status
      if (!['draft', 'pending'].includes(donation.status) && req.user.role !== 'admin') {
        return fail(res, 'Cannot update donation in current status', 400);
      }

      // Update donation
      const updatedDonation = await Donation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      return ok(res, { donation: updatedDonation }, 'Donation updated successfully');
    } catch (error) {
      console.error('Update donation error:', error);
      return fail(res, 'Failed to update donation', 500);
    }
  }
);

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to delete this donation', 403);
    }

    // Only allow deletion if not matched or completed
    if (['matched', 'completed'].includes(donation.status)) {
      return fail(res, 'Cannot delete donation that is matched or completed', 400);
    }

    // Delete donation
    await Donation.findByIdAndDelete(req.params.id);

    // Update user statistics
    await User.findByIdAndUpdate(donation.donor._id, {
      $inc: { 'statistics.totalDonations': -1 }
    });

    return ok(res, null, 'Donation deleted successfully');
  } catch (error) {
    console.error('Delete donation error:', error);
    return fail(res, 'Failed to delete donation', 500);
  }
});

// @desc    Transition donation state
// @route   PUT /api/donations/:id/transition
// @access  Private (Admin or Owner)
router.put('/:id/transition', protect, async (req, res) => {
  try {
    const { toState, metadata } = req.body;
    
    if (!toState) {
      return fail(res, 'Target state is required', 400);
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check permissions
    const isOwner = donation.donor._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return fail(res, 'Not authorized', 403);
    }

    // Execute transition
    const result = await donationFSM.transition(
      donation,
      toState,
      {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      metadata || {}
    );

    // Save donation
    await donation.save();

    return ok(res, {
      donation,
      transition: result
    }, `Donation transitioned to ${toState}`);

  } catch (error) {
    console.error('Transition error:', error);
    return fail(res, error.message, 400);
  }
});

// @desc    Get valid transitions for donation
// @route   GET /api/donations/:id/transitions
// @access  Private
router.get('/:id/transitions', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    const validTransitions = donationFSM.getValidTransitions(donation.status);
    
    return ok(res, {
      current_state: donation.status,
      valid_transitions: validTransitions,
      is_terminal: donationFSM.isTerminalState(donation.status)
    }, 'Valid transitions retrieved');

  } catch (error) {
    console.error('Get transitions error:', error);
    return fail(res, 'Failed to get transitions', 500);
  }
});

// @desc    Get donation lifecycle stats
// @route   GET /api/donations/:id/lifecycle
// @access  Private
router.get('/:id/lifecycle', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    const stats = donationFSM.getLifecycleStats(donation.state_history);
    
    return ok(res, {
      donation_id: donation._id,
      current_state: donation.status,
      stats: stats,
      state_history: donation.state_history
    }, 'Lifecycle stats retrieved');

  } catch (error) {
    console.error('Get lifecycle error:', error);
    return fail(res, 'Failed to get lifecycle stats', 500);
  }
});

// @desc    Unflag donation (approve after review)
// @route   PUT /api/donations/:id/unflag
// @access  Private (Admin)
router.put('/:id/unflag', protect, restrictTo('admin'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Unflag and transition to pending
    donation.isFlagged = false;
    donation.flagReason = '';
    
    await donationFSM.transition(
      donation,
      'pending',
      {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      {
        action: 'unflagged',
        notes: req.body.notes || 'Reviewed and unflagged by admin'
      }
    );

    await donation.save();

    return ok(res, { donation }, 'Donation unflagged successfully');
  } catch (error) {
    console.error('Unflag donation error:', error);
    return fail(res, error.message, 400);
  }
});

// @desc    Get congratulations details for donor (by donationId)
// @route   GET /api/donations/:id/congratulations
// @access  Private (Donor)
router.get('/:id/congratulations', protect, restrictTo('donor'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email statistics achievements')
      .populate('acceptedBy', 'name profile.profilePicture organization'); // ✅ CHANGED FROM 'ngo' TO 'acceptedBy'
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check if the donor owns the donation
    if (donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to view congratulations for this donation', 403);
    }

    // Check if donation is completed
    // ✅ Allow congratulations for delivered, fulfilled, or completed donations
// More permissive status check
const allowedStatuses = ['delivered', 'fulfilled', 'completed', 'accepted_by_ngo', 'pickup_scheduled', 'in_transit'];
if (!allowedStatuses.includes(donation.status)) {
  return fail(res, `Donation must be in a valid completion state to view congratulations. Current status: ${donation.status}`, 400);
}


    // Get donor details with stats
    const donor = await User.findById(req.user.id);
    
    // Prepare congratulations data for voluntary donations
    const congratulationsData = {
      donation: {
        id: donation._id,
        title: donation.title,
        category: donation.category,
        quantity: donation.quantity,
        status: donation.status,
        images: donation.images || []
      },
      recipient: {
        name: donation.acceptedBy?.name || 'NGO', // ✅ CHANGED FROM 'ngo' TO 'acceptedBy'
        profilePicture: donation.acceptedBy?.profile?.profilePicture?.url || '', // ✅ CHANGED
        organization: donation.acceptedBy?.organization?.name || '' // ✅ CHANGED
      },
      feedback: {
        rating: donation.completion?.feedback?.rating || 0,
        comment: donation.completion?.feedback?.comment || 'Thank you for your generous donation!',
        submittedAt: donation.completion?.completedAt || donation.updatedAt
      },
      impact: {
        beneficiariesHelped: donation.completion?.impact?.beneficiariesHelped || 0,
        impactStory: donation.completion?.impact?.impactStory || '',
        photos: donation.completion?.impact?.photos || []
      },
      donorStats: {
        rating: donor.statistics?.rating || 0,
        totalRatings: donor.statistics?.totalRatings || 0,
        completedDonations: donor.statistics?.completedDonations || 0,
        totalBeneficiariesHelped: donor.statistics?.totalBeneficiariesHelped || 0
      },
      achievements: donor.achievements || [],
      isVoluntaryDonation: true
    };

    return ok(res, congratulationsData, 'Congratulations data retrieved successfully');
  } catch (error) {
    console.error('Get donation congratulations error:', error);
    return fail(res, 'Failed to get congratulations data', 500);
  }
});


export default router;
