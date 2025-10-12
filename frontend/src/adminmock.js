// Mock data for ReWearify Admin Dashboard

export const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    role: "Donor",
    status: "Active",
    joinDate: "2024-01-15",
    totalDonations: 12,
    lastActivity: "2024-11-20",
    location: "New York, NY"
  },
  {
    id: 2,
    name: "Hope Community Center",
    email: "admin@hopecc.org",
    role: "NGO",
    status: "Active",
    joinDate: "2024-02-10",
    totalRequests: 8,
    lastActivity: "2024-11-19",
    location: "Los Angeles, CA"
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "m.chen@email.com",
    role: "Donor",
    status: "Blocked",
    joinDate: "2024-03-05",
    totalDonations: 3,
    lastActivity: "2024-10-15",
    location: "Chicago, IL"
  },
  {
    id: 4,
    name: "Helping Hands Foundation",
    email: "contact@helpinghands.org",
    role: "NGO",
    status: "Active",
    joinDate: "2024-01-20",
    totalRequests: 15,
    lastActivity: "2024-11-18",
    location: "Houston, TX"
  },
  {
    id: 5,
    name: "Admin User",
    email: "admin@rewearify.com",
    role: "Admin",
    status: "Active",
    joinDate: "2024-01-01",
    totalActions: 156,
    lastActivity: "2024-11-20",
    location: "San Francisco, CA"
  }
];

export const mockDonations = [
  {
    id: 1,
    donorName: "Sarah Johnson",
    donorEmail: "sarah.johnson@email.com",
    itemType: "Business Attire Set",
    description: "Professional clothing for job interviews",
    quantity: 5,
    condition: "Excellent",
    status: "pending",
    dateSubmitted: "2024-11-20",
    images: ["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=200&h=200&fit=crop"],
    category: "Professional Wear",
    size: "Medium",
    tags: ["business", "formal", "interview"]
  },
  {
    id: 2,
    donorName: "Michael Chen",
    donorEmail: "m.chen@email.com",
    itemType: "Winter Coats",
    description: "Warm winter coats for children",
    quantity: 8,
    condition: "Good",
    status: "approved",
    dateSubmitted: "2024-11-18",
    dateApproved: "2024-11-19",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop"],
    category: "Children's Wear",
    size: "Various",
    tags: ["winter", "children", "outerwear"]
  },
  {
    id: 3,
    donorName: "Emma Davis",
    donorEmail: "emma.davis@email.com",
    itemType: "School Uniforms",
    description: "Clean school uniforms for elementary students",
    quantity: 12,
    condition: "Good",
    status: "approved",
    dateSubmitted: "2024-11-15",
    dateApproved: "2024-11-16",
    images: ["https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=200&fit=crop"],
    category: "School Wear",
    size: "Various",
    tags: ["school", "uniform", "children"]
  },
  {
    id: 4,
    donorName: "James Wilson",
    donorEmail: "j.wilson@email.com",
    itemType: "Casual Wear",
    description: "Casual clothing items for teenagers",
    quantity: 15,
    condition: "Fair",
    status: "rejected",
    dateSubmitted: "2024-11-10",
    dateRejected: "2024-11-12",
    rejectReason: "Items not meeting quality standards",
    images: ["https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&h=200&fit=crop"],
    category: "Casual Wear",
    size: "Large",
    tags: ["casual", "teenager", "everyday"]
  },
  {
    id: 5,
    donorName: "Lisa Parker",
    donorEmail: "lisa.parker@email.com",
    itemType: "Sports Equipment",
    description: "Soccer cleats and jerseys",
    quantity: 6,
    condition: "Excellent",
    status: "pending",
    dateSubmitted: "2024-11-19",
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop"],
    category: "Sports & Recreation",
    size: "Various",
    tags: ["sports", "soccer", "equipment"]
  }
];

export const mockRequests = [
  {
    id: 1,
    ngoName: "Hope Community Center",
    ngoEmail: "admin@hopecc.org",
    requestTitle: "Kids School Uniforms",
    description: "Requesting 6 items from 'Kids School Uniforms'",
    priority: "medium",
    status: "pending",
    dateRequested: "2024-11-18",
    itemsNeeded: 6,
    beneficiaries: 25,
    urgency: "Medium",
    category: "Education Support"
  },
  {
    id: 2,
    ngoName: "Helping Hands Foundation",
    ngoEmail: "contact@helpinghands.org",
    requestTitle: "Winter Clothing Drive",
    description: "Urgent need for winter coats and warm clothing",
    priority: "high",
    status: "approved",
    dateRequested: "2024-11-15",
    dateApproved: "2024-11-16",
    itemsNeeded: 20,
    beneficiaries: 50,
    urgency: "High",
    category: "Emergency Relief"
  }
];

export const mockAnalytics = {
  userStats: {
    totalUsers: 1247,
    activeUsers: 1156,
    newUsersThisMonth: 89,
    userGrowth: 12.5
  },
  donationStats: {
    totalDonations: 3842,
    approvedDonations: 3156,
    pendingDonations: 234,
    rejectedDonations: 452,
    donationGrowth: 8.3
  },
  matchStats: {
    totalMatches: 2847,
    successfulMatches: 2634,
    pendingMatches: 213,
    matchRate: 92.5
  },
  systemHealth: {
    platformUtilization: 87,
    aiSystemPerformance: 94,
    userSatisfaction: 91,
    serverUptime: 99.8
  }
};

export const mockChartData = {
  userGrowth: [
    { month: 'Jan', users: 850, donors: 520, ngos: 330 },
    { month: 'Feb', users: 920, donors: 580, ngos: 340 },
    { month: 'Mar', users: 1050, donors: 650, ngos: 400 },
    { month: 'Apr', users: 1120, donors: 700, ngos: 420 },
    { month: 'May', users: 1180, donors: 740, ngos: 440 },
    { month: 'Jun', users: 1247, donors: 780, ngos: 467 }
  ],
  donationTrends: [
    { month: 'Jan', donations: 2450, approved: 2100, rejected: 350 },
    { month: 'Feb', donations: 2680, approved: 2300, rejected: 380 },
    { month: 'Mar', donations: 2950, approved: 2550, rejected: 400 },
    { month: 'Apr', donations: 3200, approved: 2800, rejected: 400 },
    { month: 'May', donations: 3500, approved: 3050, rejected: 450 },
    { month: 'Jun', donations: 3842, approved: 3356, rejected: 486 }
  ],
  categoryDistribution: [
    { name: 'Professional Wear', value: 35 },
    { name: 'Children\'s Clothing', value: 28 },
    { name: 'Casual Wear', value: 20 },
    { name: 'Sports & Recreation', value: 12 },
    { name: 'Other', value: 5 }
  ]
};