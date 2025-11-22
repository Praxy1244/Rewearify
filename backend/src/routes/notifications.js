import express from 'express';
import Notification from '../models/Notification.js';
import { ok, fail, paginated } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    let query = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    // ✨ UPDATED: Return in expected format
    return res.json({
      success: true,
      data: notifications,  // Array of notifications
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


// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return fail(res, 'Notification not found', 404);
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return ok(res, { notification }, 'Notification marked as read');
  } catch (error) {
    console.error('Mark notification read error:', error);
    return fail(res, 'Failed to mark notification as read', 500);
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    return ok(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return fail(res, 'Failed to mark all notifications as read', 500);
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
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

    // Get target users
    const User = (await import('../models/User.js')).default;
    let query = { status: 'active' };
    if (targetRole) {
      query.role = targetRole;
    }

    const users = await User.find(query).select('_id');
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

    // Send real-time notifications via Socket.IO
    const io = req.app.get('io');
    if (io) {
      userIds.forEach(userId => {
        io.to(`user-${userId}`).emit('notification', {
          type,
          title,
          message,
          createdAt: new Date()
        });
      });
    }

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