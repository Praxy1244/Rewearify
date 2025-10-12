import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Donation',
    required: [true, 'Match must have a donation']
  },
  request: {
    type: mongoose.Schema.ObjectId,
    ref: 'Request',
    required: [true, 'Match must have a request']
  },
  donor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Match must have a donor']
  },
  requester: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Match must have a requester']
  },
  matchScore: {
    type: Number,
    required: [true, 'Match score is required'],
    min: 0,
    max: 1
  },
  aiAnalysis: {
    categoryMatch: {
      score: { type: Number, min: 0, max: 1 },
      confidence: { type: Number, min: 0, max: 1 }
    },
    locationMatch: {
      distance: { type: Number, min: 0 }, // in km
      score: { type: Number, min: 0, max: 1 }
    },
    urgencyMatch: {
      score: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    qualityMatch: {
      score: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    sizeMatch: {
      score: { type: Number, min: 0, max: 1 },
      availableSizes: [String],
      requestedSizes: [String]
    },
    overallReasons: [String],
    recommendations: [String],
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['suggested', 'pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'suggested'
  },
  communication: {
    messages: [{
      sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      }
    }],
    lastMessageAt: Date,
    unreadCount: {
      donor: { type: Number, default: 0 },
      requester: { type: Number, default: 0 }
    }
  },
  logistics: {
    method: {
      type: String,
      enum: ['pickup', 'delivery', 'meetup', 'courier'],
      default: 'pickup'
    },
    scheduledDate: Date,
    scheduledTime: String,
    location: {
      address: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },
    instructions: String,
    contactPerson: {
      name: String,
      phone: String,
      email: String
    },
    tracking: {
      status: {
        type: String,
        enum: ['pending', 'in_transit', 'delivered', 'failed'],
        default: 'pending'
      },
      trackingNumber: String,
      courier: String,
      updates: [{
        status: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        location: String
      }]
    }
  },
  acceptance: {
    donorAccepted: {
      type: Boolean,
      default: false
    },
    donorAcceptedAt: Date,
    requesterAccepted: {
      type: Boolean,
      default: false
    },
    requesterAcceptedAt: Date,
    autoAccepted: {
      type: Boolean,
      default: false
    }
  },
  completion: {
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    donorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      wouldDonateAgain: Boolean,
      processRating: Number,
      submittedAt: Date
    },
    requesterFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      impact: String,
      beneficiariesHelped: Number,
      photos: [String],
      submittedAt: Date
    },
    adminVerification: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      notes: String
    }
  },
  analytics: {
    responseTime: {
      donorResponse: Number, // minutes
      requesterResponse: Number, // minutes
    },
    completionTime: Number, // hours from match to completion
    satisfactionScore: Number,
    issuesReported: [{
      type: String,
      description: String,
      reportedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      reportedAt: {
        type: Date,
        default: Date.now
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  metadata: {
    source: {
      type: String,
      enum: ['ai_auto', 'admin_manual', 'user_request'],
      default: 'ai_auto'
    },
    algorithm: String,
    version: String,
    confidence: Number,
    alternativeMatches: [{
      donation: {
        type: mongoose.Schema.ObjectId,
        ref: 'Donation'
      },
      score: Number,
      reason: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
matchSchema.index({ donation: 1, request: 1 }, { unique: true });
matchSchema.index({ donor: 1 });
matchSchema.index({ requester: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ matchScore: -1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ 'logistics.scheduledDate': 1 });

// Virtual for match success rate
matchSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed' && 
         this.acceptance.donorAccepted && 
         this.acceptance.requesterAccepted;
});

// Pre middleware to populate related documents
matchSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'donation',
      select: 'title category quantity images status location'
    },
    {
      path: 'request', 
      select: 'title category urgency quantity timeline location'
    },
    {
      path: 'donor',
      select: 'name profile.profilePicture contact.phone statistics.rating'
    },
    {
      path: 'requester',
      select: 'name profile.profilePicture organization contact.phone statistics.rating'
    }
  ]);
  next();
});

// Method to accept match (donor)
matchSchema.methods.acceptByDonor = async function() {
  this.acceptance.donorAccepted = true;
  this.acceptance.donorAcceptedAt = new Date();
  
  if (this.acceptance.requesterAccepted) {
    this.status = 'accepted';
  } else {
    this.status = 'pending';
  }
  
  return this.save();
};

// Method to accept match (requester)
matchSchema.methods.acceptByRequester = async function() {
  this.acceptance.requesterAccepted = true;
  this.acceptance.requesterAcceptedAt = new Date();
  
  if (this.acceptance.donorAccepted) {
    this.status = 'accepted';
  } else {
    this.status = 'pending';
  }
  
  return this.save();
};

// Method to complete match
matchSchema.methods.complete = async function(completedBy) {
  this.status = 'completed';
  this.completion.completedAt = new Date();
  this.completion.completedBy = completedBy;
  
  // Calculate completion time
  const completionTime = (this.completion.completedAt - this.createdAt) / (1000 * 60 * 60); // hours
  this.analytics.completionTime = completionTime;
  
  return this.save();
};

// Method to add message
matchSchema.methods.addMessage = async function(senderId, message) {
  this.communication.messages.push({
    sender: senderId,
    message: message
  });
  
  this.communication.lastMessageAt = new Date();
  
  // Update unread count
  if (senderId.toString() === this.donor.toString()) {
    this.communication.unreadCount.requester += 1;
  } else {
    this.communication.unreadCount.donor += 1;
  }
  
  return this.save();
};

// Static method to get match statistics
matchSchema.statics.getStatistics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalMatches: { $sum: 1 },
        completedMatches: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageMatchScore: { $avg: '$matchScore' },
        averageCompletionTime: { $avg: '$analytics.completionTime' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMatches: 0,
    completedMatches: 0,
    averageMatchScore: 0,
    averageCompletionTime: 0
  };
};

export default mongoose.model('Match', matchSchema);