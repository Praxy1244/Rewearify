import express from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { donationValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';
import donationFSM from '../services/fsmService.js';

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

      console.log('🔍 Running fraud detection...');
      console.log('📦 Checking quantity:', donationData.quantity);

      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      let fraudCheckResult = null;

      try {
        const fraudResponse = await axios.post(`${AI_SERVICE_URL}/fraud-check`, {
          category: donationData.category,
          condition: donationData.condition,
          quantity: donationData.quantity,
          description: donationData.description,
          location: donationData.location
        }, { timeout: 5000 });

        console.log('✅ Fraud API Response:', JSON.stringify(fraudResponse.data, null, 2));

        if (fraudResponse.data.success) {
          fraudCheckResult = fraudResponse.data.data;
          console.log(`📊 Fraud Score: ${fraudCheckResult.fraud_score}`);
          console.log(`📊 Risk Level: ${fraudCheckResult.risk_level}`);
          console.log(`📊 Is Suspicious: ${fraudCheckResult.is_suspicious}`);
          
          // ✅ Save riskScore AND riskLevel
          donationData.riskScore = fraudCheckResult.fraud_score;
          donationData.riskLevel = fraudCheckResult.risk_level;
          donationData.aiAnalysis = {
            ...donationData.aiAnalysis,
            fraudScore: fraudCheckResult.fraud_score,
            qualityScore: fraudCheckResult.quality_score || 0,
            riskLevel: fraudCheckResult.risk_level
          };
          
          console.log('💾 Data to save:', {
            riskScore: donationData.riskScore,
            riskLevel: donationData.riskLevel
          });
        } else {
          console.log('⚠️ Fraud check returned success:false');
        }
      } catch (aiError) {
        console.error('⚠️ Fraud check failed (non-blocking):', aiError.message);
        if (aiError.response) {
          console.error('Response data:', aiError.response.data);
        }
      }

      console.log('📝 Creating donation...');
      const donation = await Donation.create(donationData);

      console.log('✅ Donation created:', {
        id: donation._id,
        riskScore: donation.riskScore,
        riskLevel: donation.riskLevel
      });

      // Auto-flag if suspicious
      if (fraudCheckResult && fraudCheckResult.is_suspicious) {
        console.log('🚨 High fraud risk detected - flagging donation');
        
        donation.isFlagged = true;
        donation.flagReason = fraudCheckResult.fraud_flags ? fraudCheckResult.fraud_flags.join(', ') : '';
        
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
              fraud_score: fraudCheckResult.fraud_score,
              risk_level: fraudCheckResult.risk_level,
              flags: fraudCheckResult.fraud_flags,
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
              message: `Donation "${donation.title}" flagged for review. Risk score: ${(fraudCheckResult.fraud_score * 100).toFixed(0)}%`,
              data: {
                donationId: donation._id,
                donorId: req.user.id,
                donorName: req.user.name,
                fraudScore: fraudCheckResult.fraud_score,
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
        fraud_check: fraudCheckResult
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

// ==================== DYNAMIC ID ROUTES (AFTER SPECIAL ROUTES) ====================

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

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
