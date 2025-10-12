import mongoose from 'mongoose';

const resetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Reset token must belong to a user']
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
  },
  type: {
    type: String,
    enum: ['password_reset', 'email_verification', 'phone_verification', 'account_activation'],
    default: 'password_reset'
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  ipAddress: String,
  userAgent: String,
  metadata: {
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    lastAttempt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resetTokenSchema.index({ token: 1 });
resetTokenSchema.index({ userId: 1, type: 1 });
resetTokenSchema.index({ expiresAt: 1 });
resetTokenSchema.index({ used: 1 });

// Method to validate token
resetTokenSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date() && this.metadata.attempts < this.metadata.maxAttempts;
};

// Method to use token
resetTokenSchema.methods.use = async function(ipAddress, userAgent) {
  this.used = true;
  this.usedAt = new Date();
  this.ipAddress = ipAddress;
  this.userAgent = userAgent;
  return this.save();
};

// Method to increment attempts
resetTokenSchema.methods.incrementAttempts = async function() {
  this.metadata.attempts += 1;
  this.metadata.lastAttempt = new Date();
  return this.save();
};

// Static method to cleanup expired tokens
resetTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true },
      { 'metadata.attempts': { $gte: '$metadata.maxAttempts' } }
    ]
  });
};

export default mongoose.model('ResetToken', resetTokenSchema);