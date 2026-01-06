// backend/src/scripts/seedSuperData.js
// Comprehensive seed data for AI clustering, recommendations, and forecasting

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found!');
  process.exit(1);
}

// ==================== CITY DATA WITH REAL COORDINATES ====================
const CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', coords: [72.8777, 19.0760] },
  { name: 'Delhi', state: 'Delhi', coords: [77.1025, 28.7041] },
  { name: 'Bengaluru', state: 'Karnataka', coords: [77.5946, 12.9716] },
  { name: 'Hyderabad', state: 'Telangana', coords: [78.4867, 17.3850] },
  { name: 'Chennai', state: 'Tamil Nadu', coords: [80.2707, 13.0827] },
  { name: 'Kolkata', state: 'West Bengal', coords: [88.3639, 22.5726] },
  { name: 'Pune', state: 'Maharashtra', coords: [73.8567, 18.5204] },
  { name: 'Ahmedabad', state: 'Gujarat', coords: [72.5714, 23.0225] },
  { name: 'Jaipur', state: 'Rajasthan', coords: [75.7873, 26.9124] },
  { name: 'Mysuru', state: 'Karnataka', coords: [76.6394, 12.2958] }
];

// ==================== NGO TEMPLATES FOR CLUSTERING ====================
const NGO_TEMPLATES = [
  // Education-focused NGOs
  { 
    baseName: 'Learn & Grow Foundation',
    cause: 'Education',
    specialFocus: ["Kids Wear", "Footwear"],
    capacityRange: [150, 300],
    urgentNeed: false,
    acceptanceRate: 0.85
  },
  {
    baseName: 'School Support Trust',
    cause: 'Child Welfare',
    specialFocus: ["Kids Wear", "All types"],
    capacityRange: [200, 400],
    urgentNeed: true,
    acceptanceRate: 0.90
  },
  // Women empowerment NGOs
  {
    baseName: 'Women Empowerment Society',
    cause: 'Women Empowerment',
    specialFocus: ["Women's Wear", "Accessories"],
    capacityRange: [100, 250],
    urgentNeed: false,
    acceptanceRate: 0.80
  },
  {
    baseName: 'Shakti Foundation',
    cause: 'Women Empowerment',
    specialFocus: ["Women's Wear", "All types"],
    capacityRange: [120, 280],
    urgentNeed: true,
    acceptanceRate: 0.88
  },
  // Poverty/General welfare NGOs
  {
    baseName: 'Hope For All',
    cause: 'Poverty',
    specialFocus: ["All types"],
    capacityRange: [300, 500],
    urgentNeed: false,
    acceptanceRate: 0.92
  },
  {
    baseName: 'Seva Trust',
    cause: 'General',
    specialFocus: ["Men's Wear", "Women's Wear", "Kids Wear"],
    capacityRange: [250, 450],
    urgentNeed: false,
    acceptanceRate: 0.87
  },
  // Winter-focused NGOs
  {
    baseName: 'Winter Warmth Initiative',
    cause: 'Disaster Relief',
    specialFocus: ["Winter Wear", "Accessories"],
    capacityRange: [100, 200],
    urgentNeed: true,
    acceptanceRate: 0.95
  },
  // Healthcare NGOs
  {
    baseName: 'Health & Hygiene Trust',
    cause: 'Healthcare',
    specialFocus: ["All types", "Accessories"],
    capacityRange: [150, 300],
    urgentNeed: false,
    acceptanceRate: 0.83
  }
];

// ==================== DONATION CATEGORIES ====================
const CATEGORIES = {
  outerwear: { weight: 0.15, seasons: ['Winter', 'Monsoon'] },
  formal: { weight: 0.12, seasons: ['All Season'] },
  casual: { weight: 0.25, seasons: ['Summer', 'All Season'] },
  children: { weight: 0.20, seasons: ['All Season'] },
  accessories: { weight: 0.10, seasons: ['All Season'] },
  shoes: { weight: 0.08, seasons: ['All Season'] },
  activewear: { weight: 0.05, seasons: ['Summer', 'All Season'] },
  household: { weight: 0.05, seasons: ['All Season'] }
};

const CONDITIONS = ['excellent', 'good', 'fair'];

// ==================== HELPER FUNCTIONS ====================
function randomOffset(base, range = 0.1) {
  return base + (Math.random() - 0.5) * range;
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectWeightedCategory() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [category, { weight }] of Object.entries(CATEGORIES)) {
    cumulative += weight;
    if (rand <= cumulative) return category;
  }
  
  return 'casual';
}

function getRandomDate(daysBack) {
  return new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
}

// ==================== MAIN SEED FUNCTION ====================
async function seedSuperData() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🌱 STARTING SUPER DATA SEED FOR AI CLUSTERING & RECOMMENDATIONS');
    console.log('='.repeat(70) + '\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = (await import('../models/User.js')).default;
    const Donation = (await import('../models/Donation.js')).default;
    const Request = (await import('../models/Request.js')).default;

    // ==================== CLEAR EXISTING DATA ====================
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
      Request.deleteMany({})
    ]);
    console.log('✅ Database cleared\n');

    // ==================== CREATE ADMIN ====================
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rewearify.com',
      password: adminPassword,
      role: 'admin',
      location: {
        address: '123 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001',
        coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] }
      },
      verification: {
        isEmailVerified: true,
        isPhoneVerified: true,
        isOrganizationVerified: true
      },
      status: 'active'
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    // ==================== CREATE DONORS ====================
    console.log('👥 Creating 30 donors...');
    const defaultPassword = await bcrypt.hash('Password@123', 12);
    
    const donorNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
      'Ananya Iyer', 'Rohan Mehta', 'Kavya Nair', 'Arjun Desai', 'Meera Kulkarni',
      'Sanjay Verma', 'Divya Joshi', 'Karthik Rao', 'Neha Gupta', 'Aditya Malhotra',
      'Pooja Kapoor', 'Rahul Agarwal', 'Shreya Das', 'Varun Bansal', 'Isha Chatterjee',
      'Manish Tiwari', 'Anjali Saxena', 'Kunal Shah', 'Ritu Bharti', 'Sameer Khan',
      'Nidhi Mishra', 'Tushar Rane', 'Swati Bhatt', 'Gaurav Sinha', 'Preeti Kohli'
    ];

    const donors = [];
    for (let i = 0; i < donorNames.length; i++) {
      const city = CITIES[i % CITIES.length];
      
      donors.push({
        name: donorNames[i],
        email: `donor${i + 1}@example.com`,
        password: defaultPassword,
        role: 'donor',
        location: {
          address: `${randomInRange(1, 500)} ${['MG Road', 'Brigade Road', 'Park Street', 'Mall Road', 'Main Street'][i % 5]}`,
          city: city.name,
          state: city.state,
          country: 'India',
          zipCode: `${400000 + randomInRange(1, 99999)}`,
          coordinates: {
            type: 'Point',
            coordinates: [
              randomOffset(city.coords[0], 0.05),
              randomOffset(city.coords[1], 0.05)
            ]
          }
        },
        contact: {
          phone: `+91${randomInRange(7000000000, 9999999999)}`
        },
        verification: {
          isEmailVerified: true,
          isPhoneVerified: true
        },
        statistics: {
          totalDonations: 0,
          completedDonations: 0,
          totalRatings: 0,
          rating: 0,
          totalBeneficiariesHelped: 0
        },
        status: 'active'
      });
    }

    const insertedDonors = await User.insertMany(donors);
    console.log(`✅ Created ${insertedDonors.length} donors\n`);

    // ==================== CREATE NGOs (FOR CLUSTERING) ====================
    console.log('🏢 Creating 60 NGOs optimized for clustering...');
    
    const ngos = [];
    let ngoIndex = 1;

    // Create 6 NGOs per city (spread templates)
    for (const city of CITIES) {
      for (let i = 0; i < 6; i++) {
        const template = NGO_TEMPLATES[i % NGO_TEMPLATES.length];
        const [minCap, maxCap] = template.capacityRange;
        
        ngos.push({
          name: `${template.baseName} ${city.name}`,
          email: `ngo${ngoIndex}@example.com`,
          password: defaultPassword,
          role: 'recipient',
          location: {
            address: `${randomInRange(1, 200)} ${['Sector', 'Phase', 'Block', 'Area', 'Colony'][i % 5]} ${i + 1}`,
            city: city.name,
            state: city.state,
            country: 'India',
            zipCode: `${400000 + randomInRange(1, 99999)}`,
            coordinates: {
              type: 'Point',
              coordinates: [
                randomOffset(city.coords[0], 0.15),
                randomOffset(city.coords[1], 0.15)
              ]
            }
          },
          contact: {
            phone: `+91${randomInRange(7000000000, 9999999999)}`
          },
          organization: {
            name: `${template.baseName} ${city.name}`,
            type: 'NGO',
            registrationNumber: `REG${randomInRange(100000, 999999)}`
          },
          recipientProfile: {
            specialFocus: template.specialFocus,
            capacityPerWeek: randomInRange(minCap, maxCap),
            urgentNeed: template.urgentNeed,
            cause: template.cause,
            acceptanceRate: template.acceptanceRate,
            operatingHours: '9 AM - 5 PM',
            preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          verification: {
            isEmailVerified: true,
            isPhoneVerified: true,
            isOrganizationVerified: true
          },
          statistics: {
            totalRequests: 0,
            totalDonations: 0,
            rating: 4.0 + Math.random() * 1.0,
            totalRatings: 0
          },
          status: 'active'
        });
        
        ngoIndex++;
      }
    }

    const insertedNGOs = await User.insertMany(ngos);
    console.log(`✅ Created ${insertedNGOs.length} NGOs`);
    console.log(`   Distributed across ${CITIES.length} cities for geo-clustering`);
    console.log(`   ${NGO_TEMPLATES.length} behavioral profiles for behavioral clustering\n`);

    // ==================== CREATE HISTORICAL DONATIONS (FOR RECOMMENDATIONS) ====================
    console.log('📦 Creating 800 historical donations for recommendation engine...');
    
    const historicalDonations = [];
    const donorNGOPreferences = {}; // Track donor preferences for realistic patterns
    
    // Initialize donor preferences
    insertedDonors.forEach(donor => {
      donorNGOPreferences[donor._id.toString()] = {
        preferredCategories: [selectWeightedCategory(), selectWeightedCategory()],
        preferredNGOs: []
      };
    });

    for (let i = 0; i < 800; i++) {
      const donor = insertedDonors[randomInRange(0, insertedDonors.length - 1)];
      const donorPrefs = donorNGOPreferences[donor._id.toString()];
      
      // 70% chance to donate in preferred category
      const category = Math.random() < 0.7 
        ? donorPrefs.preferredCategories[randomInRange(0, 1)]
        : selectWeightedCategory();
      
      const categoryData = CATEGORIES[category];
      const season = categoryData.seasons[randomInRange(0, categoryData.seasons.length - 1)];
      
      // Select NGO (with some repeat preference pattern)
      let selectedNGO;
      if (donorPrefs.preferredNGOs.length > 0 && Math.random() < 0.4) {
        // 40% chance to donate to previously donated NGO
        selectedNGO = donorPrefs.preferredNGOs[randomInRange(0, donorPrefs.preferredNGOs.length - 1)];
      } else {
        // Select new NGO based on location preference (60% nearby)
        if (Math.random() < 0.6) {
          // Nearby NGO
          const nearbyNGOs = insertedNGOs.filter(ngo => ngo.location.city === donor.location.city);
          selectedNGO = nearbyNGOs[randomInRange(0, nearbyNGOs.length - 1)];
        } else {
          selectedNGO = insertedNGOs[randomInRange(0, insertedNGOs.length - 1)];
        }
        
        // Add to preferences if not already there
        if (!donorPrefs.preferredNGOs.includes(selectedNGO)) {
          donorPrefs.preferredNGOs.push(selectedNGO);
        }
      }
      
      const createdAt = getRandomDate(180); // Up to 180 days back
      const completedAt = new Date(createdAt.getTime() + randomInRange(3, 21) * 24 * 60 * 60 * 1000);
      
      historicalDonations.push({
        donor: donor._id,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Items - ${season}`,
        description: 'Quality items in good condition, cleaned and ready for distribution.',
        category,
        subcategory: category,
        season,
        condition: CONDITIONS[randomInRange(0, CONDITIONS.length - 1)],
        quantity: randomInRange(5, 50),
        sizes: [{ size: ['S', 'M', 'L', 'XL', 'XXL'][randomInRange(0, 4)], quantity: 10 }],
        location: donor.location,
        availability: {
          pickupAvailable: true,
          deliveryRadius: randomInRange(10, 30)
        },
        preferences: {
          urgentNeeded: Math.random() > 0.8,
          preferredRecipients: [selectedNGO._id]
        },
        tags: [category, season],
        status: 'completed',
        approvedBy: admin._id,
        approvedAt: new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000),
        acceptedBy: selectedNGO._id,
        acceptedAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
        pickupSchedule: {
          date: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '10:00 AM',
          instructions: 'Please call before arrival'
        },
        inTransitAt: new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        completedAt: completedAt,
        completion: {
          completedAt: completedAt,
          completedBy: admin._id,
          feedback: {
            rating: randomInRange(3, 5),
            comment: 'Great quality items, helped many beneficiaries!'
          }
        },
        createdAt,
        updatedAt: completedAt,
        aiAnalysis: {
          fraudScore: Math.random() * 0.2,
          qualityScore: 0.7 + Math.random() * 0.3,
          demandPrediction: ['medium', 'high'][randomInRange(0, 1)]
        },
        riskScore: Math.random() * 0.2,
        riskLevel: 'low'
      });
    }

    const insertedHistoricalDonations = await Donation.insertMany(historicalDonations);
    console.log(`✅ Created ${insertedHistoricalDonations.length} historical completed donations`);
    console.log(`   With realistic donor-NGO preference patterns\n`);

    // Update donor and NGO statistics based on historical donations
    console.log('📊 Updating user statistics...');
    
    for (const donation of insertedHistoricalDonations) {
      await User.findByIdAndUpdate(donation.donor, {
        $inc: {
          'statistics.totalDonations': 1,
          'statistics.completedDonations': 1,
          'statistics.totalRatings': 1
        },
        $set: {
          'statistics.rating': donation.completion.feedback.rating
        }
      });
      
      await User.findByIdAndUpdate(donation.acceptedBy, {
        $inc: {
          'statistics.totalDonations': 1
        }
      });
    }
    console.log('✅ Statistics updated\n');

    // ==================== CREATE CURRENT DONATIONS (VARIOUS STATUSES) ====================
    console.log('📦 Creating 100 current donations with various statuses...');
    
    const currentDonations = [];
    
    // Status distribution
    const statusDistribution = [
      { status: 'pending', count: 15 },
      { status: 'approved', count: 25 },
      { status: 'accepted_by_ngo', count: 20 },
      { status: 'pickup_scheduled', count: 15 },
      { status: 'in_transit', count: 10 },
      { status: 'delivered', count: 10 },
      { status: 'flagged', count: 5 }
    ];

    for (const { status, count } of statusDistribution) {
      for (let i = 0; i < count; i++) {
        const donor = insertedDonors[randomInRange(0, insertedDonors.length - 1)];
        const category = selectWeightedCategory();
        const categoryData = CATEGORIES[category];
        const season = categoryData.seasons[randomInRange(0, categoryData.seasons.length - 1)];
        
        // 50% chance to have preferredRecipients (for testing both flows)
        const hasPreferredNGO = Math.random() < 0.5;
        const selectedNGO = hasPreferredNGO 
          ? insertedNGOs[randomInRange(0, insertedNGOs.length - 1)]
          : null;
        
        const createdAt = getRandomDate(30);
        
        const donation = {
          donor: donor._id,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} - ${season} Collection`,
          description: `Quality ${category} items available for donation. Clean and in ${CONDITIONS[randomInRange(0, 2)]} condition.`,
          category,
          subcategory: category,
          season,
          condition: CONDITIONS[randomInRange(0, CONDITIONS.length - 1)],
          quantity: randomInRange(5, 40),
          sizes: [{ size: ['S', 'M', 'L', 'XL'][randomInRange(0, 3)], quantity: 8 }],
          location: donor.location,
          availability: {
            pickupAvailable: true,
            deliveryRadius: randomInRange(10, 25)
          },
          preferences: {
            urgentNeeded: Math.random() > 0.7,
            preferredRecipients: hasPreferredNGO ? [selectedNGO._id] : []
          },
          tags: [category, season],
          status,
          createdAt,
          updatedAt: new Date(),
          aiAnalysis: {
            fraudScore: Math.random() * 0.3,
            qualityScore: 0.6 + Math.random() * 0.4,
            demandPrediction: ['low', 'medium', 'high'][randomInRange(0, 2)]
          },
          riskScore: status === 'flagged' ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3,
          riskLevel: status === 'flagged' ? 'high' : 'low',
          isFlagged: status === 'flagged',
          flagReason: status === 'flagged' ? 'Suspicious quantity pattern detected' : ''
        };
        
        // Set appropriate fields based on status
        if (['approved', 'accepted_by_ngo', 'pickup_scheduled', 'in_transit', 'delivered'].includes(status)) {
          donation.approvedBy = admin._id;
          donation.approvedAt = new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000);
        }
        
        if (['accepted_by_ngo', 'pickup_scheduled', 'in_transit', 'delivered'].includes(status)) {
          const ngo = selectedNGO || insertedNGOs[randomInRange(0, insertedNGOs.length - 1)];
          donation.acceptedBy = ngo._id;
          donation.acceptedAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
        }
        
        if (['pickup_scheduled', 'in_transit', 'delivered'].includes(status)) {
          donation.pickupSchedule = {
            date: new Date(Date.now() + randomInRange(1, 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'][randomInRange(0, 3)],
            instructions: 'Please call 30 minutes before arrival'
          };
          donation.pickupScheduledAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        }
        
        if (['in_transit', 'delivered'].includes(status)) {
          donation.inTransitAt = new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000);
        }
        
        if (status === 'delivered') {
          donation.deliveredAt = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
        }
        
        currentDonations.push(donation);
      }
    }

    const insertedCurrentDonations = await Donation.insertMany(currentDonations);
    console.log(`✅ Created ${insertedCurrentDonations.length} current donations`);
    
    const statusCounts = insertedCurrentDonations.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});
    console.log('   Status breakdown:', statusCounts);
    console.log('');

    // ==================== CREATE REQUESTS ====================
    console.log('📋 Creating 50 community requests...');
    
    const requests = [];
    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 50; i++) {
      const ngo = insertedNGOs[randomInRange(0, insertedNGOs.length - 1)];
      const category = selectWeightedCategory();
      const createdAt = getRandomDate(60);
      
      requests.push({
        requester: ngo._id,
        title: `Urgent Need: ${category.charAt(0).toUpperCase() + category.slice(1)} for Community`,
        description: `We need ${category} items for our ongoing community support program. Any condition acceptable, will be distributed to those in need.`,
        category,
        subcategory: category,
        urgency: urgencyLevels[randomInRange(0, urgencyLevels.length - 1)],
        quantity: randomInRange(20, 100),
        sizes: [{ size: 'Various', quantity: 50 }],
        condition: {
          acceptable: ['excellent', 'good', 'fair', 'poor'],
          minimum: 'fair'
        },
        beneficiaries: {
          count: randomInRange(50, 300),
          ageGroup: ['children', 'adults', 'mixed'][randomInRange(0, 2)],
          gender: 'mixed'
        },
        location: ngo.location,
        timeline: {
          neededBy: new Date(Date.now() + randomInRange(15, 60) * 24 * 60 * 60 * 1000),
          flexible: true
        },
        logistics: {
          canPickup: true,
          pickupRadius: 30,
          needsDelivery: false,
          hasTransport: true
        },
        status: 'active',
        createdAt,
        updatedAt: new Date()
      });
    }

    const insertedRequests = await Request.insertMany(requests);
    console.log(`✅ Created ${insertedRequests.length} community requests\n`);

    // ==================== SUMMARY ====================
    console.log('='.repeat(70));
    console.log('🎉 SUPER DATA SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Database Summary:');
    console.log(`   ✅ Admin Users: 1`);
    console.log(`   ✅ Donors: ${insertedDonors.length}`);
    console.log(`   ✅ NGOs: ${insertedNGOs.length} (optimized for clustering)`);
    console.log(`   ✅ Historical Donations: ${insertedHistoricalDonations.length} (for recommendations)`);
    console.log(`   ✅ Current Donations: ${insertedCurrentDonations.length}`);
    console.log(`   ✅ Community Requests: ${insertedRequests.length}`);
    console.log('\n🎯 AI Features Ready:');
    console.log(`   ✅ Geographic Clustering: ${CITIES.length} cities`);
    console.log(`   ✅ Behavioral Clustering: ${NGO_TEMPLATES.length} behavioral profiles`);
    console.log(`   ✅ Recommendation Engine: ${insertedHistoricalDonations.length} donation patterns`);
    console.log(`   ✅ Forecasting Model: 180 days of time-series data`);
    console.log(`   ✅ Location-based Matching: All entities geocoded`);
    console.log('\n🔐 Test Credentials:');
    console.log(`   Admin: admin@rewearify.com / Admin@123`);
    console.log(`   Donors: donor1@example.com to donor30@example.com / Password@123`);
    console.log(`   NGOs: ngo1@example.com to ngo60@example.com / Password@123`);
    console.log('\n');

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error(error.stack);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedSuperData();
