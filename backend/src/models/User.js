import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { geocodeAddress } from '../utils/geocode.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() { return !this.social?.googleId; }, // Conditionally required
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['donor', 'recipient', 'admin', 'pending'],
    // --- 💡 FIX: Change the default role ---
    default: 'pending', 
  },
  social: {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    }
  },
  location: {
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    zipCode: { type: String, default: '', trim: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  contact: {
    phone: { type: String, trim: true }
  },
  organization: {
    name: { type: String, trim: true },
    type: { type: String, enum: ['NGO', 'Charity', 'Community Group', 'School', 'Other'] },
    registrationNumber: { type: String, trim: true },
    
  },
  profile: {
    bio: { type: String, default: '', maxlength: 500 },
    profilePicture: {
      url: { type: String, default: '' },
    },
  },
  verification: {
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isOrganizationVerified: { type: Boolean, default: false },
  },
  security: {
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
    },
  },
  statistics: {
    totalDonations: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  lastActive: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- 💡 REFACTORED METHODS SECTION ---
// Grouping all methods in a single object assignment is a more robust pattern.
userSchema.methods = {
  // Method to compare passwords
  comparePassword: async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  },

  // Method to increment login attempts
  incLoginAttempts: async function() {
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
      this.security.loginAttempts = 1;
      this.security.lockUntil = undefined;
    } else {
      this.security.loginAttempts = (this.security.loginAttempts || 0) + 1;
    }
    
    if (this.security.loginAttempts >= 5 && !this.isLocked) {
      this.security.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // Lock for 2 hours
    }
    return this.save({ validateBeforeSave: false }); // Save and return the promise
  },

  // Method to reset login attempts
  resetLoginAttempts: function() {
    this.security.loginAttempts = 0;
    this.security.lockUntil = undefined;
    return this.save({ validateBeforeSave: false }); // Save and return the promise
  },

  // Method to update last active timestamp
  updateLastActive: function() {
    this.lastActive = new Date();
    return this.save({ validateBeforeSave: false }); // Save and return the promise
  }
};
// --- END OF REFACTORED METHODS ---

userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Password Hashing Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Geocoding middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('location.address') && this.location.address?.trim()) {
    const fullAddress = [
      this.location.address,
      this.location.city,
      this.location.state,
      this.location.country || 'India'
    ].filter(Boolean).join(', ');
    
    try {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
            this.location.coordinates = { type: 'Point', coordinates: coords };
        } else {
            console.warn(`Geocoding failed for address: ${fullAddress}. Using default coordinates.`);
            this.location.coordinates = { type: 'Point', coordinates: [0, 0] };
        }
    } catch(err) {
        console.error('Geocoding error during save:', err);
        this.location.coordinates = { type: 'Point', coordinates: [0, 0] }; // Fallback
    }
  }
  next(); // Make sure to call next() even if geocoding wasn't run
});


export default mongoose.model('User', userSchema);

