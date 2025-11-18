import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema({
  categoryConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  conditionScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  demandPrediction: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  matchingTags: [String],
  estimatedSize: String,
  material: String,
  seasonalTag: String,
  suggestions: [String],
  fraudScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Donation must belong to a donor']
  },
  title: {
    type: String,
    required: [true, 'Donation title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'outerwear', 'formal', 'casual', 'children', 
      'accessories', 'shoes', 'activewear', 'undergarments',
      'traditional', 'seasonal', 'maternity', 'plus-size',
      // --- FIX 1: ADDED NEW CATEGORIES ---
      'household', 
      'linens', 
      'other'
    ]
  },
  // --- FIX 2: ADDED NEW SUBCATEGORY FIELD ---
  subcategory: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000']
  },
  sizes: [{
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  colors: [String],
  brand: {
    type: String,
    default: ''
  },
  originalPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'matched', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    zipCode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
        default: [0, 0]
      }
    }
  },
  availability: {
    pickupAvailable: {
      type: Boolean,
      default: true
    },
    deliveryAvailable: {
      type: Boolean,
      default: false
    },
    deliveryRadius: {
      type: Number,
      default: 10, // km
      min: 0,
      max: 100
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    availableUntil: Date,
    timeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },
  preferences: {
    urgentNeeded: {
      type: Boolean,
      default: false
    },
    preferredRecipients: [String], // NGO types
    restrictions: [String],
    specialInstructions: String
  },
  tags: [String],
  aiAnalysis: aiAnalysisSchema,
  moderation: {
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    moderatorNotes: String
  },
  matching: {
    matchedWith: {
      type: mongoose.Schema.ObjectId,
      ref: 'Request'
    },
    matchedAt: Date,
    matchScore: {
      type: Number,
      min: 0,
      max: 1
    },
    autoMatched: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    inquiryCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  },
  completion: {
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    }
  },
  // Legacy/Simplified AI fields (kept for compatibility with Phase 3 code)
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ""
  },
  riskScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
donationSchema.index({ donor: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ category: 1 });
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ 'preferences.urgentNeeded': 1 });
donationSchema.index({ expiresAt: 1 });
donationSchema.index({ tags: 1 });
donationSchema.index({ 'aiAnalysis.demandPrediction': 1 });

// Virtual for requests
donationSchema.virtual('requests', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'donation'
});

// Virtual for active requests count
donationSchema.virtual('activeRequestsCount', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'donation',
  count: true,
  match: { status: 'pending' }
});

// Pre middleware to populate donor info
donationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'donor',
    select: 'name email profile.profilePicture location.city contact.phone statistics.rating'
  });
  next();
});

// Method to increment view count
donationSchema.methods.incrementViews = async function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to approve donation
donationSchema.methods.approve = async function(adminId, notes = '') {
  this.status = 'approved';
  this.moderation.approvedBy = adminId;
  this.moderation.approvedAt = new Date();
  this.moderation.moderatorNotes = notes;
  return this.save();
};

// Method to reject donation
donationSchema.methods.reject = async function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.moderation.rejectedBy = adminId;
  this.moderation.rejectedAt = new Date();
  this.moderation.rejectionReason = reason;
  this.moderation.moderatorNotes = notes;
  return this.save();
};

// Method to match with request
donationSchema.methods.matchWith = async function(requestId, matchScore = 0, autoMatched = false) {
  this.status = 'matched';
  this.matching.matchedWith = requestId;
  this.matching.matchedAt = new Date();
  this.matching.matchScore = matchScore;
  this.matching.autoMatched = autoMatched;
  return this.save();
};

// Static method to find nearby donations
donationSchema.statics.findNearby = function(coordinates, maxDistance = 10000, filters = {}) {
  const query = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'approved',
    ...filters
  };
  
  return this.find(query);
};

// Static method to get trending donations
donationSchema.statics.getTrending = function(limit = 10) {
  return this.find({ status: 'approved' })
    .sort({ 'analytics.viewCount': -1, createdAt: -1 })
    .limit(limit);
};

export default mongoose.model('Donation', donationSchema);