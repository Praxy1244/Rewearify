import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { ok, fail, paginated } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { adminValidations, handleValidationErrors } from '../utils/validation.js';
import { sendTemplateEmail } from '../utils/email.js';

const router = express.Router();

// All routes require admin access
router.use(protect, restrictTo('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get comprehensive statistics
    const stats = await Promise.all([
      // User statistics
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'recipient' }),

      // Donation statistics
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'pending' }),
      Donation.countDocuments({ status: 'approved' }),
      Donation.countDocuments({ status: 'rejected' }),
      Donation.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Request statistics
      Request.countDocuments(),
      Request.countDocuments({ status: 'active' }),
      Request.countDocuments({ urgency: { $in: ['high', 'critical'] } }),
      Request.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Match statistics
      Match.countDocuments(),
      Match.countDocuments({ status: 'completed' }),
      Match.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    const [
      totalUsers, newUsersThisMonth, activeUsers, totalDonors, totalRecipients,
      totalDonations, pendingDonations, approvedDonations, rejectedDonations, newDonationsThisWeek,
      totalRequests, activeRequests, urgentRequests, newRequestsThisWeek,
      totalMatches, completedMatches, newMatchesThisWeek
    ] = stats;

    // Calculate rates and percentages
    const matchRate = totalDonations > 0 ? (completedMatches / totalDonations) * 100 : 0;
    const approvalRate = totalDonations > 0 ? (approvedDonations / totalDonations) * 100 : 0;
    const userGrowthRate = totalUsers > newUsersThisMonth ? 
      ((newUsersThisMonth / (totalUsers - newUsersThisMonth)) * 100) : 0;

    const dashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growthRate: Math.round(userGrowthRate * 100) / 100,
        donors: totalDonors,
        recipients: totalRecipients
      },
      donations: {
        total: totalDonations,
        pending: pendingDonations,
        approved: approvedDonations,
        rejected: rejectedDonations,
        newThisWeek: newDonationsThisWeek,
        approvalRate: Math.round(approvalRate * 100) / 100
      },
      requests: {
        total: totalRequests,
        active: activeRequests,
        urgent: urgentRequests,
        newThisWeek: newRequestsThisWeek
      },
      matches: {
        total: totalMatches,
        completed: completedMatches,
        newThisWeek: newMatchesThisWeek,
        successRate: Math.round(matchRate * 100) / 100
      },
      systemHealth: {
        platformUtilization: Math.min(100, Math.round((activeUsers / totalUsers) * 100)),
        averageResponseTime: '1.2s',
        uptime: '99.8%'
      }
    };

    return ok(res, dashboardStats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return fail(res, 'Failed to get dashboard statistics', 500);
  }
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return paginated(res, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get users error:', error);
    return fail(res, 'Failed to get users', 500);
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin)
router.put('/users/:userId/status', 
  adminValidations.updateUserStatus, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return fail(res, 'User not found', 404);
      }

      // Prevent admin from changing their own status
      if (user._id.toString() === req.user.id) {
        return fail(res, 'Cannot change your own account status', 400);
      }

      // Update user status
      user.status = status;
      await user.save();

      // Send notification to user about status change
      await Notification.createAndSend({
        recipient: user._id,
        type: 'account_status_changed',
        title: 'Account Status Updated',
        message: `Your account status has been changed to ${status}${reason ? `: ${reason}` : ''}`,
        data: {
          newStatus: status,
          reason,
          actionUrl: '/profile'
        },
        channels: { inApp: true, email: true }
      });

      return ok(res, { user }, 'User status updated successfully');
    } catch (error) {
      console.error('Update user status error:', error);
      return fail(res, 'Failed to update user status', 500);
    }
  }
);

// @desc    Get pending donations for moderation
// @route   GET /api/admin/donations/pending
// @access  Private (Admin)
router.get('/donations/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pendingDonations = await Donation.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donor', 'name email profile.profilePicture statistics.rating');

    const total = await Donation.countDocuments({ status: 'pending' });

    return paginated(res, pendingDonations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Pending donations retrieved successfully');
  } catch (error) {
    console.error('Get pending donations error:', error);
    return fail(res, 'Failed to get pending donations', 500);
  }
});

// ------------------------------------------------------------------
// 💡 THIS IS THE FIXED ROUTE
// ------------------------------------------------------------------
// @desc    Moderate donation (approve/reject)
// @route   PUT /api/admin/donations/:donationId/moderate
router.put('/donations/:donationId/moderate', 
  adminValidations.moderateDonation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { donationId } = req.params;
      const { action, reason, notes } = req.body;

      const donation = await Donation.findById(donationId).populate('donor', 'name email');
      if (!donation) {
        return fail(res, 'Donation not found', 404);
      }

      if (donation.status !== 'pending') {
        return fail(res, 'Donation is not pending moderation', 400);
      }

      // 💡 FIX: Retrieve the socket service instance
      const socketService = req.app.get('socketService');

      if (action === 'approve') {
        await donation.approve(req.user.id, notes);
        
        // 1. Create Notification in DB
        const notification = await Notification.createAndSend({
          recipient: donation.donor._id,
          type: 'donation_approved',
          title: 'Donation Approved!',
          message: `Your donation "${donation.title}" has been approved and is now live`,
          data: {
            donationId: donation._id,
            actionUrl: `/donor/donations/${donation._id}`
          },
          channels: { inApp: true, email: true }
        });

        // 💡 FIX: 2. Send Real-time Socket Event
        if (socketService) {
          socketService.sendToUser(donation.donor._id.toString(), notification);
          console.log(`📡 Notification sent to donor ${donation.donor.email}`);
        }

        // Send approval email
        try {
          await sendTemplateEmail(donation.donor.email, 'donationApproved', {
            name: donation.donor.name,
            donationTitle: donation.title,
            donationId: donation._id
          });
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }

      } else if (action === 'reject') {
        await donation.reject(req.user.id, reason, notes);
        
        // 1. Create Notification in DB
        const notification = await Notification.createAndSend({
          recipient: donation.donor._id,
          type: 'donation_rejected',
          title: 'Donation Rejected',
          message: `Your donation "${donation.title}" was rejected: ${reason}`,
          data: {
            donationId: donation._id,
            reason,
            actionUrl: `/donor/donations/${donation._id}`
          },
          channels: { inApp: true, email: true }
        });

        // 💡 FIX: 2. Send Real-time Socket Event
        if (socketService) {
          socketService.sendToUser(donation.donor._id.toString(), notification);
          console.log(`📡 Notification sent to donor ${donation.donor.email}`);
        }
      }

      return ok(res, { donation }, `Donation ${action}ed successfully`);
    } catch (error) {
      console.error('Moderate donation error:', error);
      return fail(res, 'Failed to moderate donation', 500);
    }
  }
);

// @desc    Get all donations for admin
// @route   GET /api/admin/donations
// @access  Private (Admin)
router.get('/donations', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category,
      search,
      sortBy = 'createdAt', 
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const donations = await Donation.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donor', 'name email profile.profilePicture')
      .populate('moderation.approvedBy moderation.rejectedBy', 'name');

    const total = await Donation.countDocuments(query);

    return paginated(res, donations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Donations retrieved successfully');
  } catch (error) {
    console.error('Get admin donations error:', error);
    return fail(res, 'Failed to get donations', 500);
  }
});

// @desc    Get all requests for admin
// @route   GET /api/admin/requests
// @access  Private (Admin)
router.get('/requests', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      urgency,
      search,
      sortBy = 'createdAt', 
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const requests = await Request.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('requester', 'name email profile.profilePicture organization');

    const total = await Request.countDocuments(query);

    return paginated(res, requests, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Requests retrieved successfully');
  } catch (error) {
    console.error('Get admin requests error:', error);
    return fail(res, 'Failed to get requests', 500);
  }
});

// @desc    Get all matches for admin
// @route   GET /api/admin/matches
// @access  Private (Admin)
router.get('/matches', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      sortBy = 'createdAt', 
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;

    // Build sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const matches = await Match.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Match.countDocuments(query);

    return paginated(res, matches, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Matches retrieved successfully');
  } catch (error) {
    console.error('Get admin matches error:', error);
    return fail(res, 'Failed to get matches', 500);
  }
});

// @desc    Send system-wide notification
// @route   POST /api/admin/notifications/broadcast
// @access  Private (Admin)
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { 
      title, 
      message, 
      type = 'system_update',
      targetRole, 
      channels = { inApp: true }
    } = req.body;

    if (!title || !message) {
      return fail(res, 'Title and message are required', 400);
    }

    // Build user query
    let userQuery = { status: 'active' };
    if (targetRole) userQuery.role = targetRole;

    // Get target users
    const users = await User.find(userQuery).select('_id');
    
    // Create notifications for all users
    const notifications = [];
    for (const user of users) {
      notifications.push({
        recipient: user._id,
        sender: req.user.id,
        type,
        title,
        message,
        channels,
        priority: 'medium'
      });
    }

    // Bulk create notifications
    await Notification.insertMany(notifications);

    // 💡 Socket Broadcast (Optional but recommended for broadcast)
    const socketService = req.app.get('socketService');
    if (socketService) {
      if (targetRole) {
        socketService.sendToRole(targetRole, { type, title, message });
      } else {
        socketService.broadcast({ type, title, message });
      }
    }

    return ok(res, { 
      sent: notifications.length,
      targetRole: targetRole || 'all'
    }, 'Broadcast notification sent successfully');
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return fail(res, 'Failed to send broadcast notification', 500);
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const analytics = await Promise.all([
      // User growth
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              role: '$role'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Donation trends
      Donation.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Category distribution
      Donation.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Match success rate
      Match.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const [userGrowth, donationTrends, categoryDistribution, matchStats] = analytics;

    return ok(res, {
      period,
      userGrowth,
      donationTrends,
      categoryDistribution,
      matchStats
    }, 'Analytics data retrieved successfully');
  } catch (error) {
    console.error('Get analytics error:', error);
    return fail(res, 'Failed to get analytics data', 500);
  }
});

// ==================== REQUEST APPROVAL ENDPOINTS ====================

// @desc    Get pending requests for admin approval
// @route   GET /api/admin/requests/pending
// @access  Private (Admin)
router.get('/requests/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pendingRequests = await Request.find({ status: 'pending_approval' })
      .populate('requester', 'name email organization location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments({ status: 'pending_approval' });

    return paginated(res, pendingRequests, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Pending requests retrieved successfully');
  } catch (error) {
    console.error('Get pending requests error:', error);
    return fail(res, 'Failed to get pending requests', 500);
  }
});

// @desc    Approve NGO request
// @route   PUT /api/admin/requests/:id/approve
// @access  Private (Admin)
router.put('/requests/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;

    const request = await Request.findById(req.params.id)
      .populate('requester', 'name email organization');

    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    if (request.status !== 'pending_approval') {
      return fail(res, 'Request is not pending approval', 400);
    }

    // Approve request
    request.status = 'active';
    await request.save();

    // Notify NGO that request is approved
    await Notification.create({
      recipient: request.requester._id,
      type: 'request_approved',
      title: '✅ Request Approved',
      message: `Your request "${request.title}" has been approved and is now visible to donors.`,
      data: {
        requestId: request._id,
        actionUrl: `/recipient/my-requests/${request._id}`
      },
      channels: { inApp: true, email: true }
    });

    // Notify nearby donors about new request if urgent
    if (request.urgency === 'high' || request.urgency === 'critical') {
      const nearbyDonors = await User.find({
        role: 'donor',
        status: 'active',
        'preferences.notifications.push': true
      }).limit(50);

      for (const donor of nearbyDonors) {
        await Notification.create({
          recipient: donor._id,
          type: 'new_request_available',
          title: '🆕 New Urgent Request',
          message: `${request.urgency.toUpperCase()}: ${request.requester.organization?.name || request.requester.name} needs ${request.category}`,
          data: {
            requestId: request._id,
            actionUrl: `/donor/browseNeeds`
          },
          channels: { inApp: true, push: false }
        });
      }
    }

    return ok(res, { request }, 'Request approved successfully');
  } catch (error) {
    console.error('Approve request error:', error);
    return fail(res, 'Failed to approve request', 500);
  }
});

// @desc    Reject NGO request
// @route   PUT /api/admin/requests/:id/reject
// @access  Private (Admin)
router.put('/requests/:id/reject', async (req, res) => {
  try {
    const { reason, notes } = req.body;

    if (!reason) {
      return fail(res, 'Rejection reason is required', 400);
    }

    const request = await Request.findById(req.params.id)
      .populate('requester', 'name email organization');

    if (!request) {
      return fail(res, 'Request not found', 404);
    }

    if (request.status !== 'pending_approval') {
      return fail(res, 'Request is not pending approval', 400);
    }

    // Reject request
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.adminNotes = notes || '';
    await request.save();

    // Notify NGO about rejection
    await Notification.create({
      recipient: request.requester._id,
      type: 'request_rejected',
      title: '❌ Request Not Approved',
      message: `Your request "${request.title}" was not approved. Reason: ${reason}`,
      data: {
        requestId: request._id,
        reason,
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

export default router;