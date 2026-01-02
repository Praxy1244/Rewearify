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
  // ✨ NEW: Recipient/NGO Profile for AI Clustering
  recipientProfile: {
    // Special focus - what types of clothing the NGO accepts
    specialFocus: {
      type: [String],
      enum: ["Men's Wear", "Women's Wear", "Kids Wear", "Winter Wear", "Footwear", "Accessories", "All types"],
      default: []
    },
    // Capacity - how many items the NGO can handle per week
    capacityPerWeek: { 
      type: Number, 
      default: 100,
      min: 0,
      max: 1000
    },
    // Urgent need flag - does the NGO have urgent requirements
    urgentNeed: { 
      type: Boolean, 
      default: false 
    },
    // Primary cause/mission of the NGO
    cause: {
      type: String,
      enum: ['Education', 'Healthcare', 'Poverty', 'Women Empowerment', 'Child Welfare', 'Disaster Relief', 'Environment', 'General'],
      default: 'General'
    },
    // Acceptance rate - percentage of requests accepted (0-1)
    acceptanceRate: { 
      type: Number, 
      default: 0.8,
      min: 0, 
      max: 1 
    },
    // Operating hours
    operatingHours: {
      type: String,
      default: '9 AM - 5 PM'
    },
    // Preferred donation days
    preferredDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  // Find this section (around line 68) and UPDATE it:
profile: {
  bio: { type: String, default: '', maxlength: 500 },
  profilePicture: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }, // ✅ ADD THIS LINE
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
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalBeneficiariesHelped: { type: Number, default: 0 },
    completedDonations: { type: Number, default: 0 }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_donation', 'generous_giver', 'super_donor', 'community_hero', 'five_star', 'hundred_lives', 'veteran_donor']
    },
    earnedAt: { type: Date, default: Date.now },
    title: String,
    description: String,
    icon: String
  }],
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

// --- Methods Section ---
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
    return this.save({ validateBeforeSave: false });
  },

  // Method to reset login attempts
  resetLoginAttempts: function() {
    this.security.loginAttempts = 0;
    this.security.lockUntil = undefined;
    return this.save({ validateBeforeSave: false });
  },

  // Method to update last active timestamp
  updateLastActive: function() {
    this.lastActive = new Date();
    return this.save({ validateBeforeSave: false });
  },

  // ✨ NEW: Method to calculate acceptance rate based on statistics
  calculateAcceptanceRate: function() {
    if (this.statistics.totalRequests === 0) return 0.8; // Default
    const rate = this.statistics.totalDonations / this.statistics.totalRequests;
    return Math.min(Math.max(rate, 0), 1); // Clamp between 0 and 1
  },

  // ✨ NEW: Method to get NGO data for AI clustering
  getClusteringData: function() {
    return {
      ngo_id: this._id.toString(),
      name: this.name,
      city: this.location.city || 'Unknown',
      latitude: this.location.coordinates?.coordinates?.[1] || 0,
      longitude: this.location.coordinates?.coordinates?.[0] || 0,
      special_focus: this.recipientProfile?.specialFocus?.join(', ') || 'All types',
      capacity_per_week: this.recipientProfile?.capacityPerWeek || 100,
      urgent_need: this.recipientProfile?.urgentNeed || false,
      cause: this.recipientProfile?.cause || 'General',
      acceptance_rate: this.recipientProfile?.acceptanceRate || this.calculateAcceptanceRate()
    };
  }
};

// Virtual for account lock status
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
        this.location.coordinates = { type: 'Point', coordinates: [0, 0] };
    }
  }
  next();
});

// ✨ NEW: Auto-calculate acceptance rate before save
userSchema.pre('save', function(next) {
  if (this.role === 'recipient' && this.isModified('statistics')) {
    this.recipientProfile.acceptanceRate = this.calculateAcceptanceRate();
  }
  next();
});

export default mongoose.model('User', userSchema);
