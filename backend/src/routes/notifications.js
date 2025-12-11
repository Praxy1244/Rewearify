import express from 'express';
import mongoose from 'mongoose'; // 💡 Added for ID validation
import Notification from '../models/Notification.js';
import { ok, fail } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    let query = { recipient: req.user.id };
    
    // 💡 FIX: Filter by 'status' instead of 'read'
    if (unreadOnly === 'true') {
      query.status = 'unread';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    
    // 💡 FIX: Count by 'status'
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      status: 'unread'
    });

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        unreadCount
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// ==========================================
// ⚠️ CRITICAL: THIS ROUTE MUST BE BEFORE /:id
// ==========================================
// @desc    Delete all notifications for the current user
// @route   DELETE /api/notifications/all
// @access  Private
router.delete('/all', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id
    });

    return ok(res, { deletedCount: result.deletedCount }, 'All notifications deleted successfully');
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return fail(res, 'Failed to delete all notifications', 500);
  }
});

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // 💡 SAFETY CHECK: Prevent CastError if ID is invalid (like "all")
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return fail(res, 'Invalid Notification ID', 400);
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return fail(res, 'Notification not found', 404);
    }

    await Notification.findByIdAndDelete(req.params.id);

    return ok(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Delete notification error:', error);
    return fail(res, 'Failed to delete notification', 500);
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    // 💡 SAFETY CHECK
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return fail(res, 'Invalid Notification ID', 400);
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return fail(res, 'Notification not found', 404);
    }

    // 💡 FIX: Update 'status' instead of 'read'
    notification.status = 'read';
    
    // Ensure delivery object exists
    if (!notification.delivery) notification.delivery = {};
    if (!notification.delivery.inApp) notification.delivery.inApp = {};
    
    notification.delivery.inApp.readAt = new Date();
    await notification.save();

    return ok(res, { notification }, 'Notification marked as read');
  } catch (error) {
    console.error('Mark notification read error:', error);
    return fail(res, 'Failed to mark notification as read', 500);
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    // 💡 FIX: Update 'status' field from 'unread' to 'read'
    await Notification.updateMany(
      { recipient: req.user.id, status: 'unread' },
      { 
        status: 'read', 
        'delivery.inApp.readAt': new Date() 
      }
    );

    return ok(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return fail(res, 'Failed to mark all notifications as read', 500);
  }
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id)
      .select('preferences.notifications');

    return ok(res, { settings: user.preferences.notifications }, 'Notification settings retrieved');
  } catch (error) {
    console.error('Get notification settings error:', error);
    return fail(res, 'Failed to get notification settings', 500);
  }
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
router.put('/settings', protect, async (req, res) => {
  try {
    const { email, push, sms } = req.body;
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'preferences.notifications.email': email,
        'preferences.notifications.push': push,
        'preferences.notifications.sms': sms
      },
      { new: true }
    ).select('preferences.notifications');

    return ok(res, { settings: user.preferences.notifications }, 'Notification settings updated');
  } catch (error) {
    console.error('Update notification settings error:', error);
    return fail(res, 'Failed to update notification settings', 500);
  }
});

// @desc    Send broadcast notification (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private (Admin)
router.post('/broadcast', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { title, message, type = 'announcement', targetRole, channels } = req.body;

    if (!title || !message) {
      return fail(res, 'Title and message are required', 400);
    }

    // Build user query
    let userQuery = { status: 'active' };
    if (targetRole) userQuery.role = targetRole;

    // Get target users
    const User = (await import('../models/User.js')).default;
    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(user => user._id);

    // Create notifications for all target users
    const notifications = userIds.map(userId => ({
      recipient: userId,
      type,
      title,
      message,
      channels: channels || { inApp: true, email: false, push: false }
    }));

    await Notification.insertMany(notifications);

    return ok(res, { 
      sent: userIds.length,
      targetRole: targetRole || 'all'
    }, 'Broadcast notification sent successfully');
  } catch (error) {
    console.error('Send broadcast notification error:', error);
    return fail(res, 'Failed to send broadcast notification', 500);
  }
});

export default router;