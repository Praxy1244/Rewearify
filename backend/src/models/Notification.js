import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient']
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  type: {
  type: String,
  required: [true, 'Notification type is required'],
  enum: [
    'donation_approved',
    'donation_rejected', 
    'donation_matched',
    'donation_completed',
    'donation_picked_up',        // ✅ ADD THIS
    'donation_delivered',        // ✅ ADD THIS
    'request_matched',
    'request_fulfilled',
    'new_donation_nearby',
    'new_request_nearby',
    'match_suggestion',
    'system_update',
    'account_verified',
    'new_donation_request',
    'request_accepted',
    'request_rejected',
    'logistics_scheduled',
    'pickup_scheduled',          // ✅ ADD THIS
    'status_update',
    'feedback_submitted',
    'request_completed',
    'congratulations',           // ✅ ADD THIS
    'ngo_accepted',              // ✅ ADD THIS
    'donation_offer',            // ✅ ADD THIS
    'password_changed',
    'feedback_received', 
    'login_alert',
    'reminder',
    'promotion',
    'feedback_request',
    'new_donation_pending',
    'fraud_alert'
  ]
},

  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    donationId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Donation'
    },
    requestId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Request'
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    matchId: String,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  delivery: {
    inApp: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      readAt: Date
    },
    email: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    },
    sms: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    },
    push: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    }
  },
  scheduledFor: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ priority: 1 });

// 💡 THIS IS THE CRITICAL FIX
// Virtual property 'read' to bridge the gap between frontend (boolean) and backend (status string)
notificationSchema.virtual('read').get(function() {
  return this.status === 'read';
});

// Virtual for formatted creation date
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Pre middleware to populate sender info
notificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name profile.profilePicture'
  });
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.status = 'read';
  this.delivery.inApp.readAt = new Date();
  return this.save();
};

// Method to mark as archived
notificationSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = await this.create(notificationData);
  
  // Mark as delivered immediately for simplicity
  notification.delivery.inApp.delivered = true;
  notification.delivery.inApp.deliveredAt = new Date();
  
  await notification.save();
  return notification;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: 'unread'
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, status: 'unread' },
    { 
      status: 'read',
      'delivery.inApp.readAt': new Date()
    }
  );
};

export default mongoose.model('Notification', notificationSchema);