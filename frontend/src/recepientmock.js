// Enhanced mock data for ReWearify Recipient Dashboard

export const mockUser = {
  id: "1",
  name: "Michael",
  email: "michael@kindhands.org",
  phone: "+91 9876543210",
  role: "Recipient",
  profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  ngo: {
    id: "ngo1",
    name: "Kind Hands",
    location: "Shimoga, Karnataka",
    address: "123 Service Road, Shimoga, Karnataka 577201",
    verified: true,
    activePartner: true,
    description: "Dedicated to helping underprivileged communities with clothing and basic necessities."
  },
  stats: {
    totalRequests: 5,
    itemsReceived: 12,
    peopleHelped: 8
  }
};

export const mockDashboardStats = {
  availableItems: 24,
  pendingRequests: 2,
  approvedItems: 3
};

export const mockProgress = {
  itemsReceived: {
    current: 12,
    target: 20,
    percentage: 60
  },
  peopleHelped: {
    current: 8,
    target: 15,
    percentage: 53
  }
};

export const mockDonationItems = [
  {
    id: "item1",
    title: "Winter Coats Collection",
    description: "High-quality winter coats for adults and children",
    category: "outerwear",
    itemCount: 5,
    location: "New York, NY",
    quality: "excellent",
    availability: "available",
    donorName: "Sarah Johnson",
    donorOrg: "NYC Community Care",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    tags: ["winter", "adults", "children"],
    datePosted: "2025-09-05"
  },
  {
    id: "item2",
    title: "Kids School Uniforms",
    description: "Clean school uniforms for elementary school children",
    category: "children",
    itemCount: 12,
    location: "Boston, MA",
    quality: "excellent",
    availability: "available",
    donorName: "Boston Elementary School",
    donorOrg: "Educational Support Network",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1986&q=80",
    tags: ["children", "school", "uniforms"],
    datePosted: "2025-09-07"
  },
  {
    id: "item3",
    title: "Professional Suits",
    description: "Business suits for job interviews and professional settings",
    category: "formal",
    itemCount: 8,
    location: "Chicago, IL",
    quality: "good",
    availability: "available",
    donorName: "Corporate Outreach Program",
    donorOrg: "Business Leaders United",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
    tags: ["professional", "formal", "interviews"],
    datePosted: "2025-09-03"
  },
  {
    id: "item4",
    title: "Summer Clothing Bundle",
    description: "Light summer clothes for families",
    category: "casual",
    itemCount: 20,
    location: "Miami, FL",
    quality: "good",
    availability: "available",
    donorName: "Miami Community Center",
    donorOrg: "Sunshine Support",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
    tags: ["summer", "casual", "families"],
    datePosted: "2025-09-08"
  },
  {
    id: "item5",
    title: "Sports Equipment",
    description: "Gently used sports equipment for community programs",
    category: "sports",
    itemCount: 15,
    location: "Seattle, WA",
    quality: "fair",
    availability: "available",
    donorName: "Seattle Sports Club",
    donorOrg: "Athletic Community Outreach",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    tags: ["sports", "equipment", "community"],
    datePosted: "2025-09-06"
  },
  {
    id: "item6",
    title: "Baby Clothes Collection",
    description: "Baby and toddler clothing in various sizes",
    category: "baby",
    itemCount: 30,
    location: "Austin, TX",
    quality: "excellent",
    availability: "limited",
    donorName: "Austin Family Support",
    donorOrg: "New Parent Network",
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
    tags: ["baby", "toddler", "various sizes"],
    datePosted: "2025-09-09"
  }
];

export const mockRequests = [
  {
    id: "req1",
    itemId: "item1",
    itemName: "Winter Coats Collection",
    itemImage: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    status: "approved",
    requestDate: "2025-09-08",
    approvedDate: "2025-09-10",
    quantity: 3,
    notes: "Urgent need for upcoming winter season"
  },
  {
    id: "req2",
    itemId: "item2",
    itemName: "Kids School Uniforms",
    itemImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1986&q=80",
    status: "pending",
    requestDate: "2025-09-10",
    quantity: 8,
    notes: "For children starting new school year"
  },
  {
    id: "req3",
    itemId: "item3",
    itemName: "Professional Suits",
    itemImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
    status: "pending",
    requestDate: "2025-09-09",
    quantity: 2,
    notes: "For job seekers in our employment program"
  },
  {
    id: "req4",
    itemId: "item4",
    itemName: "Summer Clothing Bundle",
    itemImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
    status: "received",
    requestDate: "2025-09-01",
    approvedDate: "2025-09-02",
    receivedDate: "2025-09-05",
    quantity: 15,
    notes: "Summer clothing for families in need"
  },
  {
    id: "req5",
    itemId: "item5",
    itemName: "Sports Equipment",
    itemImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    status: "received",
    requestDate: "2025-08-28",
    approvedDate: "2025-08-30",
    receivedDate: "2025-09-03",
    quantity: 10,
    notes: "Sports equipment for youth programs"
  }
];

export const mockOrganizations = [
  {
    id: "org1",
    name: "Hope Foundation",
    location: "Mumbai, Maharashtra",
    verified: true,
    activePartner: true,
    description: "Supporting underprivileged communities across Maharashtra with clothing and essentials.",
    contactEmail: "contact@hopefoundation.org",
    contactPhone: "+91 9876543210",
    establishedYear: 2015,
    totalDonationsReceived: 1250,
    peopleHelped: 5000,
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2089&q=80"
  },
  {
    id: "org2",
    name: "Care Connect",
    location: "Delhi, NCR",
    verified: true,
    activePartner: true,
    description: "Connecting donors with families in need across Delhi NCR region.",
    contactEmail: "help@careconnect.org",
    contactPhone: "+91 9123456789",
    establishedYear: 2018,
    totalDonationsReceived: 890,
    peopleHelped: 3200,
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: "org3",
    name: "Helping Hands Bangalore",
    location: "Bangalore, Karnataka",
    verified: false,
    activePartner: true,
    description: "Local community support organization focusing on education and basic needs.",
    contactEmail: "info@helpinghandsbangalore.org",
    contactPhone: "+91 8765432109",
    establishedYear: 2020,
    totalDonationsReceived: 340,
    peopleHelped: 1100,
    image: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
  },
  {
    id: "org4",
    name: "Unity Outreach",
    location: "Chennai, Tamil Nadu",
    verified: true,
    activePartner: false,
    description: "Promoting unity through community service and support programs.",
    contactEmail: "contact@unityoutreach.org",
    contactPhone: "+91 7654321098",
    establishedYear: 2017,
    totalDonationsReceived: 567,
    peopleHelped: 2300,
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  }
];

export const mockRecentUpdates = [
  {
    id: "1",
    type: "approval",
    message: "Your request for Winter Clothing has been approved",
    timestamp: "2025-09-10T10:30:00Z",
    read: false
  },
  {
    id: "2",
    type: "new_item",
    message: "New donation items available in your area",
    timestamp: "2025-09-09T15:45:00Z",
    read: true
  },
  {
    id: "3",
    type: "delivery",
    message: "Summer Clothing Bundle has been delivered",
    timestamp: "2025-09-05T09:15:00Z",
    read: true
  }
];

// Categories for filtering
export const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'children', label: 'Children' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'sports', label: 'Sports' },
  { value: 'baby', label: 'Baby' }
];

// Quality levels for filtering
export const qualityLevels = [
  { value: 'all', label: 'All Quality' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' }
];

// Availability status for filtering
export const availabilityStatus = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'reserved', label: 'Reserved' }
];