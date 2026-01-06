





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
      'household', 'linens', 'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  },
  season: {
    type: String,
    enum: ['Summer', 'Winter', 'Monsoon', 'All Season'],
    default: 'All Season',
    required: [true, 'Season is required']
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
    max: [10000, 'Quantity cannot exceed 10000']
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
    enum: [
      'draft', 
      'pending', 
      'approved',           // ✅ NEW - Admin approved, waiting for NGO
      'accepted_by_ngo',    // ✅ NEW - NGO accepted, waiting for pickup schedule
      'pickup_scheduled',   // ✅ NEW - Pickup date/time confirmed
      'rejected', 
      'matched', 
      'in_transit', 
      'delivered', 
      'completed', 
      'cancelled', 
      'expired', 
      'flagged'
    ],
    default: 'pending'
  },
  
  // ✨ FSM State History
  state_history: [{
    from_state: {
      type: String,
      required: true
    },
    to_state: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    actor: {
      id: {
        type: mongoose.Schema.Types.Mixed,  
        ref: 'User'
      },
      name: String,
      role: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
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
        type: [Number],
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
      default: 10,
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
    // ✅ UPDATED - Changed to ObjectId refs instead of String
    preferredRecipients: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
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
  
  // ✅ NEW: Track which NGO request this donation fulfills
  fulfillingRequest: {
    type: mongoose.Schema.ObjectId,
    ref: 'Request',
    default: null
  },
  
  // ✅ NEW WORKFLOW FIELDS
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  acceptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  pickupSchedule: {
    date: String,
    time: String,
    instructions: String,
    scheduledAt: Date
  },
  
  // FSM Timestamp Fields
  rejectedAt: Date,
  matchedAt: Date,
  pickupScheduledAt: Date,
  inTransitAt: Date,
  deliveredAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  flaggedAt: Date,
  
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
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Legacy fields for compatibility
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
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
donationSchema.index({ donor: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ category: 1 });
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ 'preferences.urgentNeeded': 1 });
donationSchema.index({ expiresAt: 1 });
donationSchema.index({ tags: 1 });
donationSchema.index({ 'aiAnalysis.demandPrediction': 1 });
donationSchema.index({ 'state_history.timestamp': 1 });
donationSchema.index({ acceptedBy: 1 });  // ✅ NEW
donationSchema.index({ approvedBy: 1 });  // ✅ NEW

// Virtuals
donationSchema.virtual('requests', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'donation'
});

donationSchema.virtual('activeRequestsCount', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'donation',
  count: true,
  match: { status: 'pending' }
});

// Pre middleware - ✅ UPDATED to populate preferredRecipients
donationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'donor',
    select: 'name email profile.profilePicture location.city contact.phone statistics.rating'
  })
  .populate({
    path: 'preferences.preferredRecipients',
    select: 'name email organization location phone'
  })
  .populate({
    path: 'acceptedBy',
    select: 'name email organization location phone'
  });
  next();
});

// Pre-save middleware to track state changes
donationSchema.pre('save', function(next) {
  if (this.isNew && !this.state_history) {
    this.state_history = [];
  }
  next();
});

// Methods
donationSchema.methods.incrementViews = async function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

donationSchema.methods.approve = async function(adminId, notes = '') {
  this.status = 'approved';
  this.moderation.approvedBy = adminId;
  this.moderation.approvedAt = new Date();
  this.approvedAt = new Date();
  this.approvedBy = adminId;  // ✅ NEW
  this.moderation.moderatorNotes = notes;
  return this.save();
};

donationSchema.methods.reject = async function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.moderation.rejectedBy = adminId;
  this.moderation.rejectedAt = new Date();
  this.rejectedAt = new Date();
  this.moderation.rejectionReason = reason;
  this.moderation.moderatorNotes = notes;
  return this.save();
};

donationSchema.methods.matchWith = async function(requestId, matchScore = 0, autoMatched = false) {
  this.status = 'matched';
  this.matching.matchedWith = requestId;
  this.matching.matchedAt = new Date();
  this.matchedAt = new Date();
  this.matching.matchScore = matchScore;
  this.matching.autoMatched = autoMatched;
  return this.save();
};

// ✅ NEW WORKFLOW METHODS
donationSchema.methods.acceptByNGO = async function(ngoId) {
  this.status = 'accepted_by_ngo';
  this.acceptedBy = ngoId;
  this.acceptedAt = new Date();
  return this.save();
};

donationSchema.methods.schedulePickup = async function(pickupDate, pickupTime, instructions = '') {
  this.status = 'pickup_scheduled';
  this.pickupSchedule = {
    date: pickupDate,
    time: pickupTime,
    instructions,
    scheduledAt: new Date()
  };
  this.pickupScheduledAt = new Date();
  return this.save();
};

// FSM-specific methods
donationSchema.methods.getLifecycleStats = function() {
  if (!this.state_history || this.state_history.length === 0) {
    return null;
  }

  const timeInStates = {};
  for (let i = 0; i < this.state_history.length; i++) {
    const entry = this.state_history[i];
    const nextEntry = this.state_history[i + 1];
    
    const startTime = new Date(entry.timestamp);
    const endTime = nextEntry ? new Date(nextEntry.timestamp) : new Date();
    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours

    if (!timeInStates[entry.to_state]) {
      timeInStates[entry.to_state] = 0;
    }
    timeInStates[entry.to_state] += duration;
  }

  return {
    total_transitions: this.state_history.length,
    time_in_states: timeInStates,
    current_state: this.status
  };
};

donationSchema.methods.getCurrentStateAge = function() {
  if (!this.state_history || this.state_history.length === 0) {
    return 0;
  }
  
  const lastTransition = this.state_history[this.state_history.length - 1];
  const now = new Date();
  const lastTransitionTime = new Date(lastTransition.timestamp);
  
  return (now - lastTransitionTime) / (1000 * 60 * 60); // hours
};

// Static methods
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

donationSchema.statics.getTrending = function(limit = 10) {
  return this.find({ status: 'approved' })
    .sort({ 'analytics.viewCount': -1, createdAt: -1 })
    .limit(limit);
};

donationSchema.statics.findByState = function(state, filters = {}) {
  return this.find({ status: state, ...filters })
    .sort({ createdAt: -1 });
};

donationSchema.statics.findStuck = function(state, hours = 72) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    status: state,
    'state_history': {
      $elemMatch: {
        to_state: state,
        timestamp: { $lte: cutoffDate }
      }
    }
  });
};

export default mongoose.model('Donation', donationSchema);
