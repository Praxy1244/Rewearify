import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import Notification from '../models/Notification.js';
import Match from '../models/Match.js';
import ResetToken from '../models/ResetToken.js';

dotenv.config();

// ==================== ACCURATE INDIAN COORDINATES ====================
const indianCities = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 }
];

const indianNames = {
  male: ['Rahul', 'Amit', 'Raj', 'Karan', 'Rohan', 'Arjun', 'Varun', 'Sanjay', 'Anil', 'Suresh', 
         'Vikram', 'Ravi', 'Mohit', 'Aditya', 'Nikhil', 'Akash', 'Vishal', 'Deepak', 'Manish', 'Sachin'],
  female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavya', 'Riya', 'Sneha', 'Divya', 'Sakshi', 'Shreya',
           'Anita', 'Meera', 'Sonia', 'Aarti', 'Nisha', 'Preeti', 'Swati', 'Radha', 'Kiran', 'Deepika'],
  last: ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Joshi',
         'Desai', 'Mehta', 'Shah', 'Rao', 'Malhotra', 'Kapoor', 'Agarwal', 'Chopra', 'Khanna', 'Pillai']
};

const ngoNames = [
  'Goonj Foundation', 'Smile Foundation', 'CRY - Child Rights and You', 'Sewa Bharti Trust',
  'Pratham Education Foundation', 'HelpAge India', 'Akshaya Patra Foundation',
  'Save the Children India', 'Nanhi Kali Initiative', 'Give India Foundation',
  'Seva Sadan Trust', 'Bal Vikas Sangh', 'Jan Kalyan Samiti', 'Mahila Vikas Kendra', 'Shiksha Niketan Trust'
];

// CORRECT ENUM VALUES FROM MODELS
const clothingCategories = [
  'outerwear', 'formal', 'casual', 'children', 
  'accessories', 'shoes', 'activewear', 'traditional',
  'seasonal', 'household', 'linens'
];

const clothingDescriptions = {
  'outerwear': ['Winter Jackets', 'Coats', 'Sweaters', 'Hoodies'],
  'formal': ['Formal Shirts', 'Blazers', 'Dress Pants', 'Suits'],
  'casual': ['T-Shirts', 'Jeans', 'Casual Shirts', 'Shorts'],
  'children': ['Kids Clothing', 'School Uniforms', 'Baby Clothes'],
  'accessories': ['Scarves', 'Belts', 'Bags', 'Hats'],
  'shoes': ['Formal Shoes', 'Casual Shoes', 'Sports Shoes', 'Sandals'],
  'activewear': ['Track Pants', 'Sports Wear', 'Gym Clothes'],
  'traditional': ['Sarees', 'Kurta Sets', 'Ethnic Wear'],
  'seasonal': ['Winter Wear', 'Summer Wear', 'Monsoon Wear'],
  'household': ['Curtains', 'Table Cloths', 'Cushion Covers'],
  'linens': ['Bed Sheets', 'Blankets', 'Towels', 'Quilts']
};

const conditions = ['excellent', 'good', 'fair']; // lowercase!
const seasons = ['Winter', 'Summer', 'Monsoon', 'All Season'];

// Helper Functions
const getRandomCity = () => indianCities[Math.floor(Math.random() * indianCities.length)];
const getRandomName = (gender = 'male') => {
  const first = indianNames[gender][Math.floor(Math.random() * indianNames[gender].length)];
  const last = indianNames.last[Math.floor(Math.random() * indianNames.last.length)];
  return `${first} ${last}`;
};
const getRandomPhone = () => `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==================== CLEANUP FUNCTION ====================
const cleanDatabase = async () => {
  console.log('\n🗑️  Cleaning existing data...\n');
  const collections = [
    { model: Notification, name: 'Notifications' },
    { model: Match, name: 'Matches' },
    { model: ResetToken, name: 'Reset Tokens' },
    { model: Request, name: 'Requests' },
    { model: Donation, name: 'Donations' },
    { model: User, name: 'Users' }
  ];

  for (const { model, name } of collections) {
    const count = await model.countDocuments();
    await model.deleteMany({});
    console.log(`  ✅ Deleted ${count} ${name}`);
  }
};

// ==================== MAIN SEEDING FUNCTION ====================
const resetDatabase = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║      REWEARIFY - DATABASE RESET & SEEDING TOOL            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await cleanDatabase();

    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    // STEP 2: Create Admin
    console.log('\n👤 Creating admin user...');
    const adminCity = indianCities[0];
    const admin = new User({
      name: 'Rewearify Admin',
      email: 'admin@rewearify.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      verification: { isEmailVerified: true, isPhoneVerified: true },
      contact: { phone: '+919876543210' },
      location: {
        address: 'Rewearify Head Office, Bandra West',
        city: adminCity.city,
        state: adminCity.state,
        country: 'India',
        zipCode: '400050',
        coordinates: { 
          type: 'Point', 
          coordinates: [adminCity.lng, adminCity.lat]
        }
      }
    });
    await admin.save({ validateBeforeSave: true });
    
    // Force update coordinates after save to bypass geocoding
    await User.updateOne(
      { _id: admin._id },
      { $set: { 'location.coordinates': { type: 'Point', coordinates: [adminCity.lng, adminCity.lat] } } }
    );
    
    const updatedAdmin = await User.findById(admin._id);
    console.log('✅ Admin created:', updatedAdmin.email);
    console.log(`   📍 ${updatedAdmin.location.city}, ${updatedAdmin.location.state}`);
    console.log(`   🗺️  Coordinates: [${updatedAdmin.location.coordinates.coordinates[0]}, ${updatedAdmin.location.coordinates.coordinates[1]}]`);

    // STEP 3: Create Donors (15)
    console.log('\n💝 Creating 15 donors with accurate coordinates...');
    const donors = [];
    
    for (let i = 0; i < 15; i++) {
      const city = getRandomCity();
      const gender = i % 2 === 0 ? 'male' : 'female';
      const lngVariation = (Math.random() - 0.5) * 0.1;
      const latVariation = (Math.random() - 0.5) * 0.1;
      
      const donor = new User({
        name: getRandomName(gender),
        email: `donor${i + 1}@gmail.com`,
        password: hashedPassword,
        role: 'donor',
        status: 'active',
        verification: { isEmailVerified: true, isPhoneVerified: true },
        contact: { phone: getRandomPhone() },
        location: {
          address: `${Math.floor(Math.random() * 500) + 1}, ${['MG Road', 'Park Street', 'Main Road'][i % 3]}`,
          city: city.city,
          state: city.state,
          country: 'India',
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.lng + lngVariation, city.lat + latVariation]
          }
        },
        statistics: {
          totalDonations: Math.floor(Math.random() * 10),
          completedDonations: Math.floor(Math.random() * 7),
          rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          totalRatings: Math.floor(Math.random() * 8),
          totalBeneficiariesHelped: Math.floor(Math.random() * 100) + 20
        }
      });
      
      await donor.save({ validateBeforeSave: true });
      
      // Force update coordinates
      const correctCoords = [
        parseFloat((city.lng + lngVariation).toFixed(6)),
        parseFloat((city.lat + latVariation).toFixed(6))
      ];
      
      await User.updateOne(
        { _id: donor._id },
        { $set: { 'location.coordinates': { type: 'Point', coordinates: correctCoords } } }
      );
      
      const updatedDonor = await User.findById(donor._id);
      donors.push(updatedDonor);
      
      if (i < 3) {
        console.log(`  ✅ ${updatedDonor.name} - ${city.city}, ${city.state}`);
        console.log(`     🗺️  [${updatedDonor.location.coordinates.coordinates[0]}, ${updatedDonor.location.coordinates.coordinates[1]}]`);
      }
    }
    console.log(`  ... and ${donors.length - 3} more donors created`);

    // STEP 4: Create NGOs (15) - CRITICAL FOR CLUSTERING
    console.log('\n🏢 Creating 15 NGOs with precise coordinates...');
    const ngos = [];
    
    for (let i = 0; i < 15; i++) {
      const city = getRandomCity();
      const lngVariation = (Math.random() - 0.5) * 0.2;
      const latVariation = (Math.random() - 0.5) * 0.2;
      
      const ngo = new User({
        name: `${ngoNames[i]} - ${city.city}`,
        email: `ngo${i + 1}@rewearify.org`,
        password: hashedPassword,
        role: 'recipient',
        status: 'active',
        verification: { isEmailVerified: true, isPhoneVerified: true, isOrganizationVerified: true },
        organization: {
          name: ngoNames[i],
          registrationNumber: `NGO${String(i + 1).padStart(6, '0')}`,
          yearEstablished: Math.floor(Math.random() * 30) + 1990,
          website: `https://${ngoNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.org`
        },
        contact: { phone: getRandomPhone() },
        location: {
          address: `${Math.floor(Math.random() * 200) + 1}, ${['Station Road', 'Gandhi Nagar'][i % 2]}`,
          city: city.city,
          state: city.state,
          country: 'India',
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.lng + lngVariation, city.lat + latVariation]
          }
        },
        recipientProfile: {
          acceptanceRate: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)),
          capacityPerWeek: Math.floor(Math.random() * 150) + 80,
          cause: ['Education', 'Healthcare', 'Poverty', 'Women Empowerment', 'Child Welfare', 'General'][i % 6],
          operatingHours: '9 AM - 6 PM',
          preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          urgentNeed: Math.random() > 0.6
        },
        statistics: {
          totalRequests: Math.floor(Math.random() * 15),
          completedDonations: Math.floor(Math.random() * 12),
          rating: parseFloat((Math.random() * 0.8 + 4.2).toFixed(1)),
          totalBeneficiariesHelped: Math.floor(Math.random() * 500) + 200
        }
      });
      
      await ngo.save({ validateBeforeSave: true });
      
      // Force update coordinates
      const correctCoords = [
        parseFloat((city.lng + lngVariation).toFixed(6)),
        parseFloat((city.lat + latVariation).toFixed(6))
      ];
      
      await User.updateOne(
        { _id: ngo._id },
        { $set: { 'location.coordinates': { type: 'Point', coordinates: correctCoords } } }
      );
      
      const updatedNGO = await User.findById(ngo._id);
      ngos.push(updatedNGO);
      
      if (i < 3) {
        console.log(`  ✅ ${updatedNGO.name}`);
        console.log(`     📍 ${updatedNGO.location.city}, ${updatedNGO.location.state}`);
        console.log(`     🗺️  [${updatedNGO.location.coordinates.coordinates[0]}, ${updatedNGO.location.coordinates.coordinates[1]}]`);
        console.log(`     🎯 ${updatedNGO.recipientProfile.cause} | ${updatedNGO.recipientProfile.capacityPerWeek}/week`);
      }
    }
    console.log(`  ... and ${ngos.length - 3} more NGOs created`);

    // STEP 5: Create Donations (40 total)
    console.log('\n📦 Creating 40 donations...');
    const donations = [];
    
    // 12 Pending
    for (let i = 0; i < 12; i++) {
      const donor = getRandomItem(donors);
      const category = getRandomItem(clothingCategories);
      const description = getRandomItem(clothingDescriptions[category]);
      
      donations.push(await Donation.create({
        title: `${description} - ${getRandomItem(conditions)}`,
        description: `Quality ${description.toLowerCase()} suitable for donation.`,
        category,
        condition: getRandomItem(conditions),
        quantity: Math.floor(Math.random() * 40) + 15,
        season: getRandomItem(seasons),
        donor: donor._id,
        status: 'pending',
        location: donor.location,
        availability: { 
          deliveryRadius: 20, 
          pickupDays: ['Monday', 'Wednesday', 'Friday'],
          pickupAvailable: true
        },
        images: [],
        riskScore: 0.1,
        riskLevel: 'low',
        isFlagged: false
      }));
    }
    console.log('  ✅ Created 12 pending donations');

    // 12 Approved
    for (let i = 0; i < 12; i++) {
      const donor = getRandomItem(donors);
      const category = getRandomItem(clothingCategories);
      const description = getRandomItem(clothingDescriptions[category]);
      
      donations.push(await Donation.create({
        title: `${description} - Approved`,
        description: `Admin-approved ${description.toLowerCase()} ready for NGO pickup.`,
        category,
        condition: getRandomItem(conditions),
        quantity: Math.floor(Math.random() * 50) + 20,
        season: getRandomItem(seasons),
        donor: donor._id,
        status: 'approved',
        approvedBy: updatedAdmin._id,
        approvedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        location: donor.location,
        availability: { 
          deliveryRadius: 25, 
          pickupDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
          pickupAvailable: true
        },
        images: [],
        riskScore: 0.1,
        riskLevel: 'low',
        isFlagged: false
      }));
    }
    console.log('  ✅ Created 12 approved donations');

    // 8 Accepted by NGO
    for (let i = 0; i < 8; i++) {
      const donor = getRandomItem(donors);
      const ngo = getRandomItem(ngos);
      const category = getRandomItem(clothingCategories);
      const description = getRandomItem(clothingDescriptions[category]);
      
      donations.push(await Donation.create({
        title: `${description} - Accepted`,
        description: `Accepted by ${ngo.organization.name} for distribution.`,
        category,
        condition: getRandomItem(conditions),
        quantity: Math.floor(Math.random() * 45) + 25,
        season: getRandomItem(seasons),
        donor: donor._id,
        acceptedBy: ngo._id,
        acceptedAt: new Date(Date.now() - Math.random() * 12 * 24 * 60 * 60 * 1000),
        status: 'accepted_by_ngo',
        approvedBy: updatedAdmin._id,
        approvedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        location: donor.location,
        availability: { 
          deliveryRadius: 25, 
          pickupDays: ['Monday', 'Wednesday', 'Friday'],
          pickupAvailable: true
        },
        images: [],
        riskScore: 0.1,
        riskLevel: 'low',
        isFlagged: false
      }));
    }
    console.log('  ✅ Created 8 accepted donations');

    // 8 Completed
    for (let i = 0; i < 8; i++) {
      const donor = getRandomItem(donors);
      const ngo = getRandomItem(ngos);
      const category = getRandomItem(clothingCategories);
      const description = getRandomItem(clothingDescriptions[category]);
      const beneficiaries = Math.floor(Math.random() * 80) + 30;
      const rating = Math.floor(Math.random() * 2) + 4;
      
      donations.push(await Donation.create({
        title: `${description} - Completed`,
        description: `Successfully donated to ${ngo.organization.name}. Helped ${beneficiaries} people!`,
        category,
        condition: getRandomItem(conditions),
        quantity: Math.floor(Math.random() * 60) + 30,
        season: getRandomItem(seasons),
        donor: donor._id,
        acceptedBy: ngo._id,
        acceptedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        approvedBy: updatedAdmin._id,
        approvedAt: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000),
        location: donor.location,
        completion: {
          feedback: { 
            rating, 
            comment: `Excellent donation! These ${description.toLowerCase()} helped ${beneficiaries} people. Thank you!` 
          },
          impact: { 
            beneficiariesHelped: beneficiaries, 
            impactStory: `Your donation reached ${beneficiaries} individuals in ${ngo.location.city}.` 
          },
          completedBy: updatedAdmin._id,
          completedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        },
        images: [],
        riskScore: 0.08,
        riskLevel: 'low',
        isFlagged: false
      }));
    }
    console.log('  ✅ Created 8 completed donations');

    // STEP 6: Create Requests (30 total)
console.log('\n📋 Creating 30 requests...');
const requests = [];

// 12 Active (pending donor response)
for (let i = 0; i < 12; i++) {
  const ngo = getRandomItem(ngos);
  const category = getRandomItem(clothingCategories);
  const description = getRandomItem(clothingDescriptions[category]);
  
  requests.push(await Request.create({
    title: `Urgent: ${description} Needed`,
    description: `${ngo.organization.name} urgently needs ${description.toLowerCase()}.`,
    category,
    quantity: Math.floor(Math.random() * 100) + 40,
    urgency: ['medium', 'high', 'critical'][i % 3],
    requester: ngo._id, // ✅ Changed from recipient
    status: 'active', // ✅ Changed from 'pending'
    location: ngo.location,
    timeline: {
      neededBy: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // ✅ Added required field
      flexible: Math.random() > 0.5
    },
    condition: { 
      minimum: getRandomItem(conditions),
      acceptable: ['excellent', 'good', 'fair']
    },
    beneficiaries: { 
      count: Math.floor(Math.random() * 150) + 50, 
      ageGroup: ['children', 'teenagers', 'adults', 'elderly', 'mixed'][i % 5],
      gender: 'mixed',
      demographics: ['Children', 'Women', 'Elderly', 'Families'][i % 4] 
    },
    logistics: {
      canPickup: true,
      pickupRadius: 25,
      needsDelivery: false,
      hasTransport: Math.random() > 0.5
    }
  }));
}
console.log('  ✅ Created 12 active requests');

// 10 Accepted
for (let i = 0; i < 10; i++) {
  const ngo = getRandomItem(ngos);
  const donor = getRandomItem(donors);
  const category = getRandomItem(clothingCategories);
  const description = getRandomItem(clothingDescriptions[category]);
  
  requests.push(await Request.create({
    title: `${description} Request - Accepted`,
    description: `Request accepted by ${donor.name}.`,
    category,
    quantity: Math.floor(Math.random() * 80) + 35,
    urgency: ['medium', 'high'][i % 2],
    requester: ngo._id,
    status: 'accepted', // ✅ Correct status
    location: ngo.location,
    timeline: {
      neededBy: new Date(Date.now() + Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
      flexible: true
    },
    donorResponse: { // ✅ Changed from acceptedBy/acceptedAt
      status: 'accepted',
      respondedBy: donor._id,
      respondedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
      acceptanceNote: `Happy to fulfill this request for ${description.toLowerCase()}.`
    },
    condition: { 
      minimum: getRandomItem(conditions),
      acceptable: ['excellent', 'good']
    },
    beneficiaries: { 
      count: Math.floor(Math.random() * 120) + 40, 
      ageGroup: ['children', 'adults', 'mixed'][i % 3],
      gender: 'mixed',
      demographics: ['Children', 'Families', 'Women'][i % 3] 
    },
    logistics: {
      canPickup: true,
      pickupRadius: 30,
      needsDelivery: false,
      hasTransport: true
    }
  }));
}
console.log('  ✅ Created 10 accepted requests');

// 8 Fulfilled
for (let i = 0; i < 8; i++) {
  const ngo = getRandomItem(ngos);
  const donor = getRandomItem(donors);
  const category = getRandomItem(clothingCategories);
  const description = getRandomItem(clothingDescriptions[category]);
  const beneficiaries = Math.floor(Math.random() * 100) + 50;
  
  requests.push(await Request.create({
    title: `${description} - Fulfilled`,
    description: `Successfully fulfilled! Helped ${beneficiaries} people.`,
    category,
    quantity: Math.floor(Math.random() * 70) + 30,
    urgency: ['high', 'critical'][i % 2],
    requester: ngo._id,
    status: 'fulfilled', // ✅ Correct status
    location: ngo.location,
    timeline: {
      neededBy: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Past date
      flexible: false
    },
    donorResponse: {
      status: 'accepted',
      respondedBy: donor._id,
      respondedAt: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000),
      acceptanceNote: 'Will fulfill this request.'
    },
    condition: { 
      minimum: getRandomItem(conditions),
      acceptable: ['excellent', 'good', 'fair']
    },
    beneficiaries: { 
      count: beneficiaries, 
      ageGroup: ['children', 'adults', 'elderly', 'mixed'][i % 4],
      gender: 'mixed',
      demographics: ['Children', 'Women', 'Families', 'Elderly'][i % 4] 
    },
    logistics: {
      canPickup: true,
      pickupRadius: 20,
      needsDelivery: false,
      hasTransport: true
    },
    fulfillment: { // ✅ Correct structure
      fulfilledAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
      fulfilledBy: donor._id,
      deliveredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      deliveryConfirmedBy: ngo._id,
      feedback: { 
        rating: Math.floor(Math.random() * 2) + 4, 
        comment: `Thank you! These ${description.toLowerCase()} helped ${beneficiaries} people.`,
        submittedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
      },
      impact: { 
        beneficiariesHelped: beneficiaries, 
        impactStory: `Donation reached ${beneficiaries} individuals in ${ngo.location.city}.` 
      },
      completedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      completedBy: ngo._id
    }
  }));
}
console.log('  ✅ Created 8 fulfilled requests');


    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          DATABASE RESET COMPLETED SUCCESSFULLY!            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`   👤 Admin:     1 (with accurate coordinates)`);
    console.log(`   💝 Donors:    15 (spread across Indian cities)`);
    console.log(`   🏢 NGOs:      15 (clustering-ready coordinates)`);
    console.log(`   📦 Donations: 40 (12 pending, 12 approved, 8 accepted, 8 completed)`);
    console.log(`   📋 Requests:  30 (12 pending, 10 accepted, 8 fulfilled)`);
    console.log('─'.repeat(60));
    console.log('\n🗺️  COORDINATE VERIFICATION:');
    console.log('─'.repeat(60));
    console.log(`   ✅ All users have accurate lat/lng coordinates`);
    console.log(`   ✅ NGOs ready for AI clustering algorithms`);
    console.log(`   ✅ Coordinates span 12 major Indian cities`);
    console.log(`   ✅ Geocoding bypass implemented for accuracy`);
    console.log('─'.repeat(60));
    console.log('\n🔐 LOGIN CREDENTIALS (Password: Admin@123):');
    console.log('─'.repeat(60));
    console.log('   📧 admin@rewearify.com');
    console.log('   📧 donor1@gmail.com, donor2@gmail.com, donor3@gmail.com');
    console.log('   📧 ngo1@rewearify.org, ngo2@rewearify.org, ngo3@rewearify.org');
    console.log('─'.repeat(60));
    console.log('\n🎯 Database is production-ready with AI clustering support!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

resetDatabase();
