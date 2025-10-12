// Mock data for ReWearify platform

export const mockUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    role: 'donor',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-01-15',
    location: 'New York, NY',
    donationsCount: 12,
    impactScore: 850
  },
  {
    id: '2', 
    name: 'Michael Chen',
    email: 'michael@email.com',
    role: 'recipient',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-02-20',
    location: 'Los Angeles, CA',
    receivedCount: 8,
    organization: 'Hope Community Center'
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@rewearify.com', 
    role: 'admin',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    joinDate: '2023-12-01'
  }
];

export const mockDonations = [
  {
    id: 'don_001',
    donorId: '1',
    donorName: 'Sarah Johnson',
    title: 'Winter Coats Collection',
    description: 'Gently used winter coats in various sizes, perfect for cold weather.',
    category: 'outerwear',
    condition: 'excellent',
    quantity: 5,
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Navy', 'Brown'],
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'
    ],
    status: 'approved',
    createdAt: '2024-11-15',
    approvedAt: '2024-11-16',
    aiAnalysis: {
      categoryConfidence: 0.95,
      conditionScore: 0.88,
      demandPrediction: 'high',
      matchingTags: ['winter', 'professional', 'casual']
    },
    location: 'New York, NY',
    pickupAvailable: true,
    deliveryRadius: 25
  },
  {
    id: 'don_002', 
    donorId: '1',
    donorName: 'Sarah Johnson',
    title: 'Business Attire Set',
    description: 'Professional clothing suitable for job interviews and workplace.',
    category: 'formal',
    condition: 'good',
    quantity: 8,
    sizes: ['XS', 'S', 'M'],
    colors: ['Black', 'White', 'Gray'],
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop'
    ],
    status: 'pending',
    createdAt: '2024-11-20',
    aiAnalysis: {
      categoryConfidence: 0.92,
      conditionScore: 0.75,
      demandPrediction: 'medium',
      matchingTags: ['professional', 'interview', 'workplace']
    },
    location: 'New York, NY',
    pickupAvailable: true,
    deliveryRadius: 20
  },
  {
    id: 'don_003',
    donorId: '2',
    donorName: 'Emma Wilson',
    title: 'Kids School Uniforms',
    description: 'Various school uniforms for elementary and middle school students.',
    category: 'children',
    condition: 'excellent',
    quantity: 12,
    sizes: ['6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    colors: ['Navy', 'White', 'Khaki'],
    images: [
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop'
    ],
    status: 'approved',
    createdAt: '2024-11-18',
    approvedAt: '2024-11-19',
    aiAnalysis: {
      categoryConfidence: 0.98,
      conditionScore: 0.91,
      demandPrediction: 'high',
      matchingTags: ['school', 'uniform', 'children', 'education']
    },
    location: 'Boston, MA',
    pickupAvailable: false,
    deliveryRadius: 15
  }
];

export const mockRequests = [
  {
    id: 'req_001',
    requesterId: '2',
    requesterName: 'Michael Chen',
    organization: 'Hope Community Center',
    donationId: 'don_001',
    donationTitle: 'Winter Coats Collection',
    requestedQuantity: 3,
    requestedSizes: ['M', 'L'],
    urgencyLevel: 'high',
    reason: 'Preparing for winter clothing drive for homeless community.',
    status: 'approved',
    requestedAt: '2024-11-16',
    approvedAt: '2024-11-17',
    expectedDelivery: '2024-11-22',
    aiMatchScore: 0.92,
    notes: 'Perfect match for community needs.'
  },
  {
    id: 'req_002',
    requesterId: '2', 
    requesterName: 'Michael Chen',
    organization: 'Hope Community Center',
    donationId: 'don_003',
    donationTitle: 'Kids School Uniforms',
    requestedQuantity: 6,
    requestedSizes: ['8-9Y', '10-11Y'],
    urgencyLevel: 'medium',
    reason: 'Supporting families who cannot afford school uniforms.',
    status: 'pending',
    requestedAt: '2024-11-19',
    aiMatchScore: 0.88,
    notes: 'Good match for educational support program.'
  }
];

export const mockNotifications = [
  {
    id: 'notif_001',
    userId: '1',
    type: 'donation_approved',
    title: 'Donation Approved!',
    message: 'Your winter coats donation has been approved and is now available for requests.',
    timestamp: '2024-11-16T10:30:00Z',
    read: false, // Still unread for action
    actionUrl: '/dashboard/donations/don_001'
  },
  {
    id: 'notif_002',
    userId: '1',
    type: 'request_received',
    title: 'New Request Received',
    message: 'Hope Community Center has requested 3 items from your winter coats donation.',
    timestamp: '2024-11-16T14:45:00Z',
    read: true, // Marked as read after review
    actionUrl: '/dashboard/requests/req_001'
  },
  {
    id: 'notif_003',
    userId: '2',
    type: 'request_approved',
    title: 'Request Approved',
    message: 'Your request for winter coats has been approved! Delivery scheduled for Nov 22.',
    timestamp: '2024-11-17T09:15:00Z',
    read: true,
    actionUrl: '/dashboard/my-requests/req_001'
  },
  // New notification for today
  {
    id: 'notif_004',
    userId: '1',
    type: 'thank_you',
    title: 'Thank You from Community!',
    message: 'A local family thanked you for your recent winter coats donation at 06:57 PM IST today.',
    timestamp: '2025-08-28T13:27:00Z', // 06:57 PM IST in UTC
    read: false,
    actionUrl: '/dashboard/donations/don_001'
  }
];

export const mockAnalytics = {
  totalDonations: 127,
  totalRequests: 89,
  successfulMatches: 73,
  activeUsers: 234,
  monthlyStats: [
    { month: 'Jan', donations: 15, requests: 12, matches: 10 },
    { month: 'Feb', donations: 22, requests: 18, matches: 16 },
    { month: 'Mar', donations: 28, requests: 25, matches: 21 },
    { month: 'Apr', donations: 31, requests: 28, matches: 24 },
    { month: 'May', donations: 25, requests: 22, matches: 19 },
    { month: 'Jun', donations: 33, requests: 30, matches: 27 }
  ],
  categoryDistribution: [
    { name: 'Outerwear', value: 35, color: '#10B981' },
    { name: 'Formal', value: 28, color: '#3B82F6' },  
    { name: 'Casual', value: 42, color: '#F59E0B' },
    { name: 'Children', value: 22, color: '#EF4444' }
  ],
  impactMetrics: {
    clothingItemsSaved: 1247,
    co2Reduced: '2.3 tons',
    familiesHelped: 156,
    partneredOrganizations: 28
  }
};

export const mockRecommendations = [
  {
    id: 'rec_001',
    type: 'donation_match',
    title: 'Perfect Match Found!',
    description: 'Your business attire donation matches 3 active requests from job training programs.',
    confidence: 0.94,
    potentialRequests: 3,
    estimatedImpact: 'High - Career development support'
  },
  {
    id: 'rec_002', 
    type: 'demand_prediction',
    title: 'High Demand Category',
    description: 'Winter clothing is in high demand. Consider promoting seasonal donations.',
    confidence: 0.87,
    category: 'outerwear',
    estimatedDemand: '+40% this month'
  }
];

// Mock AI Analysis Functions
export const analyzeClothingImage = async (imageFile) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    category: 'outerwear',
    categoryConfidence: 0.92,
    condition: 'good',
    conditionScore: 0.78,
    colors: ['Navy', 'Blue'],
    estimatedSize: 'M',
    material: 'Cotton blend',
    seasonalTag: 'winter',
    suggestions: [
      'Consider adding more photos from different angles',
      'This item has high demand potential',
      'Perfect for professional or casual wear'
    ]
  };
};

export const getMatchingRecommendations = (donationId) => {
  return [
    {
      requestId: 'req_001',
      matchScore: 0.95,
      reason: 'Size and category perfect match',
      urgency: 'high',
      organization: 'City Homeless Shelter'
    },
    {
      requestId: 'req_002', 
      matchScore: 0.87,
      reason: 'Good category match, size flexibility',
      urgency: 'medium',
      organization: 'Job Training Center'
    }
  ];
};