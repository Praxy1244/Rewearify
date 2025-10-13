// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { geocodeAddress } from '../utils/geocode.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['donor', 'recipient', 'admin'],
    default: 'donor',
    required: true
  },
  location: {
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    zipCode: { type: String, default: '', trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [78.9629, 20.5937], // Center of India
        validate: {
          validator: function(coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&
              coords[1] >= -90 && coords[1] <= 90
            );
          },
          message: 'Invalid coordinates: must be [longitude, latitude]'
        }
      }
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid international phone number']
    },
    whatsapp: { type: String, trim: true },
    telegram: { type: String, trim: true }
  },
  organization: {
    name: { type: String, trim: true },
    type: { 
      type: String,
      enum: ['NGO', 'Charity', 'Community Group', 'School', 'Other'],
      default: 'NGO'
    },
    registrationNumber: { type: String, trim: true }, // ← NO unique: true here
    website: { 
      type: String,
      trim: true,
      match: [/^https?:\/\/.+\..+/, 'Please provide a valid URL']
    },
    description: { 
      type: String,
      maxlength: [1000, 'Organization description too long']
    },
    servingAreas: [String],
    targetDemographics: [String],
    capacity: { 
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      default: 50
    }
  },
  profile: {
    bio: { 
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePicture: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    interests: [String],
    languages: [String]
  },
  verification: {
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isOrganizationVerified: { type: Boolean, default: false },
    verifiedBy: { 
      type: mongoose.Schema.ObjectId, 
      ref: 'User',
      default: null 
    },
    verifiedAt: { type: Date, default: null }
  },
  security: {
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
      showContact: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en', enum: ['en', 'hi', 'kn', 'es', 'fr'] },
    timezone: { type: String, default: 'UTC' }
  },
  statistics: {
    totalDonations: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    successfulMatches: { type: Number, default: 0 },
    rating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5,
      set: function(val) {
        return Math.round(val * 10) / 10;
      }
    },
    ratingCount: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === Indexes ===
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ 'verification.isOrganizationVerified': 1, role: 1 });

// ✅ FIXED: Sparse unique index for NGO registration number
userSchema.index(
  { 'organization.registrationNumber': 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { 
      'organization.registrationNumber': { $exists: true, $ne: null } 
    }
  }
);

// === Virtuals ===
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

userSchema.virtual('fullName').get(function() {
  return this.name;
});

// === Middleware ===

// 🔹 AUTO-GEOCODING MIDDLEWARE
userSchema.pre('save', async function(next) {
  if (!this.location) this.location = {};
  if (!this.location.coordinates) {
    this.location.coordinates = {
      type: 'Point',
      coordinates: [78.9629, 20.5937]
    };
  }

  if (this.isModified('location.address') && this.location.address?.trim()) {
    const fullAddress = [
      this.location.address,
      this.location.city,
      this.location.state,
      this.location.country || 'India'
    ]
      .filter(part => part && typeof part === 'string' && part.trim())
      .join(', ');

    if (fullAddress) {
      try {
        const coords = await geocodeAddress(fullAddress);
        if (coords?.length === 2) {
          this.location.coordinates.coordinates = coords;
        } else {
          this.location.coordinates.coordinates = [78.9629, 20.5937];
        }
      } catch (err) {
        console.warn('Geocoding failed, using fallback:', err.message);
        this.location.coordinates.coordinates = [78.9629, 20.5937];
      }
    }
  }
  next();
});

// 🔹 PASSWORD HASHING
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(12);
    update.password = await bcrypt.hash(update.password, salt);
  }
  next();
});

// === Methods ===
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = function() {
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lockUntil': 1
    }
  });
};

userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// === Statics ===
userSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance
      }
    },
    status: 'active'
  });
};

userSchema.statics.findVerifiedRecipients = function() {
  return this.find({
    role: 'recipient',
    'verification.isOrganizationVerified': true,
    status: 'active'
  });
};

export default mongoose.model('User', userSchema);