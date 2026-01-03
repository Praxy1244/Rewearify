import express from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { donationValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';
import donationFSM from '../services/fsmService.js';
import donorMetricsService from '../services/donorMetricsService.js';

const router = express.Router();

// ==================== GENERAL ROUTES (NO PARAMS) ====================

// @desc    Get all donations with filters and search
// @route   GET /api/donations
// @access  Public
router.get('/', searchValidations.donations, handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      condition,
      location,
      radius = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'approved',
      urgent,
      search
    } = req.query;

    // Build query
    let query = { status };
    
    if (category) query.category = category;
    if (condition) query.condition = { $in: condition.split(',') };
    if (urgent === 'true') query['preferences.urgentNeeded'] = true;
    
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
    const donations = await Donation.find(query)
    .populate('donor', 'name profile.profilePicture location.city statistics.rating')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    return paginated(res, donations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Donations retrieved successfully');
  } catch (error) {
    console.error('Get donations error:', error);
    return fail(res, 'Failed to get donations', 500);
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
    console.log(`🔍 NGO ${req.user.organization?.name} attempting to accept donation ${req.params.id}`);

    // Find donation and populate donor
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone location');

    if (!donation) {
      console.log(`❌ Donation ${req.params.id} not found`);
      return fail(res, 'Donation not found', 404);
    }

    // Check if donation is approved
    if (donation.status !== 'approved') {
      return fail(res, 'Donation must be approved first', 400);
    }

    // Check if this NGO is the targeted recipient
    const isTargetedNGO = donation.preferences?.preferredRecipients?.some(
      recipientId => recipientId.toString() === req.user.id.toString()
    );

    if (!isTargetedNGO) {
      console.log(`❌ User ${req.user.id} not authorized for donation ${donation._id}`);
      return fail(res, 'You are not authorized to accept this donation', 403);
    }

    // Check if already accepted
    if (donation.status === 'accepted_by_ngo') {
      return fail(res, 'Donation already accepted', 400);
    }

    // Update donation status
    donation.status = 'accepted_by_ngo';
    donation.acceptedBy = req.user.id;
    donation.acceptedAt = new Date();
    await donation.save();

    console.log(`✅ NGO ${req.user.organization?.name} accepted donation ${donation._id}`);

    const socketService = req.app.get('socketService');

    // Notify donor that NGO accepted
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
    return fail(res, 'Server error during acceptance', 500);
  }
});

// @desc    Donor schedules pickup after NGO acceptance
// @route   PUT /api/donations/:id/schedule-pickup
// @access  Private (Donor only)
router.put('/:id/schedule-pickup', protect, restrictTo('donor'), async (req, res) => {
  try {
    const { pickupDate, pickupTime, specialInstructions } = req.body;

    console.log(`📅 Donor ${req.user.name} scheduling pickup for donation ${req.params.id}`);

    // Validate required fields
    if (!pickupDate || !pickupTime) {
      return fail(res, 'Pickup date and time are required', 400);
    }

    // Find donation and populate NGO
    const donation = await Donation.findById(req.params.id)
      .populate('acceptedBy', 'name organization email phone');

    if (!donation) {
      console.log(`❌ Donation ${req.params.id} not found`);
      return fail(res, 'Donation not found', 404);
    }

    // Check if user is the donor
    if (donation.donor.toString() !== req.user.id.toString()) {
      console.log(`❌ User ${req.user.id} not authorized for donation ${donation._id}`);
      return fail(res, 'Only the donor can schedule pickup', 403);
    }

    // Check if NGO has accepted
    if (donation.status !== 'accepted_by_ngo') {
      return fail(res, 'NGO must accept the donation first', 400);
    }

    // Update donation with pickup schedule
    donation.pickupSchedule = {
      date: pickupDate,
      time: pickupTime,
      instructions: specialInstructions || '',
      scheduledAt: new Date()
    };
    donation.status = 'pickup_scheduled';
    await donation.save();

    console.log(`✅ Pickup scheduled: ${pickupDate} at ${pickupTime}`);

    const socketService = req.app.get('socketService');

    // Notify NGO about scheduled pickup
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
        actionUrl: `/recipient/donations/${donation._id}`
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

    return ok(res, { 
      donation,
      pickupDetails: {
        date: pickupDate,
        time: pickupTime,
        instructions: specialInstructions,
        ngoContact: {
          name: donation.acceptedBy.organization?.name || donation.acceptedBy.name,
          email: donation.acceptedBy.email,
          phone: donation.acceptedBy.phone
        }
      }
    }, 'Pickup scheduled successfully. NGO has been notified.');

  } catch (error) {
    console.error('❌ Pickup scheduling error:', error);
    return fail(res, 'Server error during pickup scheduling', 500);
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

export default router;
