import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Request must belong to a requester']
  },
  title: {
    type: String,
    required: [true, 'Request title is required'],
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
    default: ''
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
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
  preferredColors: [String],
  condition: {
    acceptable: {
      type: [String],
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: ['excellent', 'good', 'fair']
    },
    minimum: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    }
  },
  beneficiaries: {
    count: {
      type: Number,
      required: [true, 'Beneficiary count is required'],
      min: [1, 'Must have at least 1 beneficiary']
    },
    ageGroup: {
      type: String,
      enum: ['children', 'teenagers', 'adults', 'elderly', 'mixed'],
      default: 'mixed'
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'mixed'],
      default: 'mixed'
    },
    demographics: String,
    specialNeeds: [String]
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
  timeline: {
    neededBy: {
      type: Date,
      required: [true, 'Needed by date is required']
    },
    flexible: {
      type: Boolean,
      default: false
    },
    preferredPickupTimes: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },
  logistics: {
    canPickup: {
      type: Boolean,
      default: true
    },
    pickupRadius: {
      type: Number,
      default: 25, // km
      min: 0,
      max: 100
    },
    needsDelivery: {
      type: Boolean,
      default: false
    },
    hasTransport: {
      type: Boolean,
      default: false
    },
    specialRequirements: String
  },
  status: {
    type: String,
enum: ['draft', 'pending', 'active', 'pending_donor', 'accepted', 'rejected', 'pickup_scheduled', 'in_transit', 'delivered', 'fulfilled', 'cancelled', 'expired'],
default: 'pending',
   
  },
  donation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Donation'
  },
  donorResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    acceptanceNote: String
  },
  pickupDelivery: {
    method: {
      type: String,
      enum: ['pickup', 'delivery'],
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    contactPerson: String,
    contactPhone: String,
    preferredDate: Date,
    preferredTimeSlot: String,
    specialInstructions: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  matching: {
    matchedAt: Date,
    matchScore: {
      type: Number,
      min: 0,
      max: 1
    },
    autoMatched: {
      type: Boolean,
      default: false
    },
    potentialMatches: [{
      donation: {
        type: mongoose.Schema.ObjectId,
        ref: 'Donation'
      },
      score: Number,
      distance: Number,
      reasons: [String],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  verification: {
    documentsRequired: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: String,
      url: String,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date
    }],
    organizationVerified: {
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
  fulfillment: {
    fulfilledAt: Date,
    fulfilledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    deliveredAt: Date,
    deliveryConfirmedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      photos: [String],
      submittedAt: Date
    },
    impact: {
      beneficiariesHelped: Number,
      impactStory: String,
      photos: [String]
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  tags: [String],
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
requestSchema.index({ requester: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({ urgency: 1 });
requestSchema.index({ 'location.coordinates': '2dsphere' });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ 'timeline.neededBy': 1 });
requestSchema.index({ expiresAt: 1 });
requestSchema.index({ tags: 1 });

// Virtual for donations
requestSchema.virtual('donations', {
  ref: 'Donation',
  localField: '_id',
  foreignField: 'matching.matchedWith'
});

// Pre middleware to populate requester info
requestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'requester',
    select: 'name email profile.profilePicture organization location.city' // ✅ Ensure this includes profile.profilePicture
  });
  next();
});


// Method to increment view count
requestSchema.methods.incrementViews = async function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to match with donation
requestSchema.methods.matchWith = async function(donationId, matchScore = 0, autoMatched = false) {
  this.status = 'matched';
  this.donation = donationId;
  this.matching.matchedAt = new Date();
  this.matching.matchScore = matchScore;
  this.matching.autoMatched = autoMatched;
  return this.save();
};

// Method to fulfill request
requestSchema.methods.fulfill = async function(donorId) {
  this.status = 'fulfilled';
  this.fulfillment.fulfilledAt = new Date();
  this.fulfillment.fulfilledBy = donorId;
  return this.save();
};

// Static method to find nearby requests
requestSchema.statics.findNearby = function(coordinates, maxDistance = 25000, filters = {}) {
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
    status: 'active',
    ...filters
  };
  
  return this.find(query);
};

// Static method to get urgent requests
requestSchema.statics.getUrgent = function(limit = 10) {
  return this.find({ 
    status: 'active',
    urgency: { $in: ['high', 'critical'] }
  })
    .sort({ urgency: -1, 'timeline.neededBy': 1 })
    .limit(limit);
};

export default mongoose.model('Request', requestSchema);