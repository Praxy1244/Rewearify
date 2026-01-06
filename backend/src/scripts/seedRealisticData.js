import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import ForecastData from '../models/ForecastData.js';

dotenv.config();

// Indian Cities with Coordinates
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
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 }
];

// Indian Names
const indianNames = {
  male: ['Rahul', 'Amit', 'Raj', 'Karan', 'Rohan', 'Arjun', 'Varun', 'Sanjay', 'Anil', 'Suresh'],
  female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavya', 'Riya', 'Sneha', 'Divya', 'Sakshi', 'Shreya'],
  last: ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Joshi']
};

// NGO Names (Realistic Indian NGOs)
const ngoNames = [
  'Goonj Foundation',
  'Smile Foundation',
  'CRY - Child Rights and You',
  'Sewa Bharti',
  'Pratham Education',
  'HelpAge India',
  'Akshaya Patra',
  'Save the Children India',
  'Nanhi Kali',
  'Give India'
];

// Helper Functions
const getRandomCity = () => indianCities[Math.floor(Math.random() * indianCities.length)];
const getRandomName = (gender = 'male') => {
  const first = indianNames[gender][Math.floor(Math.random() * indianNames[gender].length)];
  const last = indianNames.last[Math.floor(Math.random() * indianNames.last.length)];
  return `${first} ${last}`;
};
const getRandomPhone = () => `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`;

const seedRealisticData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // STEP 1: Create Admin
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rewearify.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      verification: {
        isEmailVerified: true,
        isPhoneVerified: true
      },
      contact: { phone: '+919876543210' },
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      }
    });
    console.log('✅ Admin created:', admin.email);

    // STEP 2: Create Donors (5 donors)
    console.log('\n💝 Creating donors...');
    const donors = [];
    for (let i = 0; i < 5; i++) {
      const city = getRandomCity();
      const donor = await User.create({
        name: getRandomName('male'),
        email: `donor${i + 1}@gmail.com`,
        password: hashedPassword,
        role: 'donor',
        status: 'active',
        verification: {
          isEmailVerified: true,
          isPhoneVerified: true
        },
        contact: { phone: getRandomPhone() },
        location: {
          address: `${Math.floor(Math.random() * 500) + 1}, MG Road`,
          city: city.city,
          state: city.state,
          country: 'India',
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.lng + (Math.random() * 0.1 - 0.05), city.lat + (Math.random() * 0.1 - 0.05)]
          }
        },
        statistics: {
          totalDonations: Math.floor(Math.random() * 10),
          completedDonations: Math.floor(Math.random() * 5),
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
          totalRatings: Math.floor(Math.random() * 10),
          totalBeneficiariesHelped: Math.floor(Math.random() * 100)
        }
      });
      donors.push(donor);
      console.log(`✅ Donor ${i + 1}:`, donor.email);
    }

    // STEP 3: Create NGOs/Recipients (10 NGOs)
    console.log('\n🏢 Creating NGOs...');
    const ngos = [];
    for (let i = 0; i < 10; i++) {
      const city = getRandomCity();
      const ngo = await User.create({
        name: `${ngoNames[i]} - ${city.city}`,
        email: `ngo${i + 1}@rewearify.org`,
        password: hashedPassword,
        role: 'recipient',
        status: 'active',
        verification: {
          isEmailVerified: true,
          isPhoneVerified: true,
          isOrganizationVerified: true
        },
        organization: {
          name: ngoNames[i],
          registrationNumber: `NGO${String(i + 1).padStart(6, '0')}`,
          yearEstablished: Math.floor(Math.random() * 30) + 1990,
          website: `https://${ngoNames[i].toLowerCase().replace(/\s+/g, '')}.org`
        },
        contact: { phone: getRandomPhone() },
        location: {
          address: `${Math.floor(Math.random() * 200) + 1}, ${['Station Road', 'Park Street', 'Civil Lines', 'Nehru Nagar'][Math.floor(Math.random() * 4)]}`,
          city: city.city,
          state: city.state,
          country: 'India',
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.lng + (Math.random() * 0.2 - 0.1), city.lat + (Math.random() * 0.2 - 0.1)]
          }
        },
        recipientProfile: {
          acceptanceRate: (Math.random() * 0.3 + 0.7).toFixed(2), // 0.7 - 1.0
          capacityPerWeek: Math.floor(Math.random() * 100) + 50,
          cause: ['Education', 'Healthcare', 'General', 'Children', 'Women Empowerment'][Math.floor(Math.random() * 5)],
          operatingHours: '9 AM - 6 PM',
          preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          urgentNeed: Math.random() > 0.7
        },
        statistics: {
          totalRequests: Math.floor(Math.random() * 20),
          completedDonations: Math.floor(Math.random() * 15),
          rating: (Math.random() * 1 + 4).toFixed(1), // 4.0 - 5.0
          totalBeneficiariesHelped: Math.floor(Math.random() * 500 + 100)
        }
      });
      ngos.push(ngo);
      console.log(`✅ NGO ${i + 1}:`, ngo.name);
    }

    // STEP 4: Create Donations (Pending, Approved, Completed)
    console.log('\n📦 Creating donations...');
    
    const categories = ['Clothing', 'Footwear', 'Books', 'Toys', 'Furniture', 'Electronics'];
    const conditions = ['Excellent', 'Good', 'Fair'];
    const seasons = ['Winter', 'Summer', 'Monsoon', 'All Season'];
    
    const donations = [];
    
    // Create 15 donations with different statuses
    for (let i = 0; i < 15; i++) {
      const donor = donors[Math.floor(Math.random() * donors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = ['pending', 'approved', 'accepted_by_ngo', 'completed'][Math.floor(Math.random() * 4)];
      
      const donation = await Donation.create({
        title: `${conditions[Math.floor(Math.random() * conditions.length)]} ${category} for Donation`,
        description: `Quality ${category.toLowerCase()} in good condition. Suitable for ${seasons[Math.floor(Math.random() * seasons.length)]} season.`,
        category,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        quantity: Math.floor(Math.random() * 50) + 5,
        season: seasons[Math.floor(Math.random() * seasons.length)],
        donor: donor._id,
        status,
        location: donor.location,
        availability: {
          deliveryRadius: Math.floor(Math.random() * 30) + 10,
          pickupDays: ['Monday', 'Wednesday', 'Friday']
        },
        images: [],
        riskScore: Math.random() * 0.3, // Low risk
        riskLevel: 'low',
        isFlagged: false
      });
      
      // If completed, add completion data
      if (status === 'completed') {
        const ngo = ngos[Math.floor(Math.random() * ngos.length)];
        donation.acceptedBy = ngo._id;
        donation.acceptedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        donation.completedAt = new Date();
        donation.completion = {
          feedback: {
            rating: Math.floor(Math.random() * 2) + 4, // 4-5
            comment: 'Excellent donation! Helped many people in need. Thank you for your generosity!'
          },
          impact: {
            beneficiariesHelped: Math.floor(Math.random() * 50) + 10,
            impactStory: `These ${category.toLowerCase()} helped families in ${donor.location.city}. Your donation made a real difference!`
          },
          completedBy: admin._id,
          completedAt: new Date()
        };
        await donation.save();
      }
      
      donations.push(donation);
    }
    console.log(`✅ Created ${donations.length} donations`);

    // STEP 5: Create Requests (Pending, Accepted, Fulfilled)
    console.log('\n📋 Creating requests...');
    
    const requests = [];
    for (let i = 0; i < 10; i++) {
      const ngo = ngos[Math.floor(Math.random() * ngos.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = ['pending', 'accepted', 'fulfilled'][Math.floor(Math.random() * 3)];
      
      const request = await Request.create({
        title: `Urgent Need: ${category} for ${ngo.recipientProfile.cause}`,
        description: `We urgently need ${category.toLowerCase()} for our beneficiaries in ${ngo.location.city}. Any condition acceptable.`,
        category,
        quantity: Math.floor(Math.random() * 100) + 20,
        urgency: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        recipient: ngo._id,
        status,
        location: ngo.location,
        preferences: {
          minCondition: conditions[Math.floor(Math.random() * conditions.length)],
          acceptsPartialFulfillment: Math.random() > 0.3
        },
        beneficiaries: {
          count: Math.floor(Math.random() * 200) + 50,
          demographics: ['Children', 'Women', 'Elderly', 'Families'][Math.floor(Math.random() * 4)]
        }
      });
      
      // If accepted, add donor
      if (status === 'accepted' || status === 'fulfilled') {
        const donor = donors[Math.floor(Math.random() * donors.length)];
        request.acceptedBy = donor._id;
        request.acceptedAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
        
        if (status === 'fulfilled') {
          request.fulfilledAt = new Date();
          request.completion = {
            feedback: {
              rating: Math.floor(Math.random() * 2) + 4,
              comment: 'Thank you for fulfilling our request! The items were perfect.'
            },
            impact: {
              beneficiariesHelped: Math.floor(Math.random() * 100) + 30,
              impactStory: `Your donation helped ${request.beneficiaries.count} people in our community!`
            }
          };
        }
        await request.save();
      }
      
      requests.push(request);
    }
    console.log(`✅ Created ${requests.length} requests`);

    // STEP 6: Create Forecast Data for AI
    console.log('\n📊 Creating forecast data...');
    
    const forecastData = [];
    for (const category of categories) {
      for (const city of indianCities.slice(0, 5)) { // Top 5 cities
        const forecast = await ForecastData.create({
          category,
          region: city.city,
          season: 'All Season',
          predictedDemand: Math.floor(Math.random() * 500) + 100,
          confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
          factors: {
            historical: Math.random() * 0.5 + 0.3,
            seasonal: Math.random() * 0.3 + 0.2,
            events: Math.random() * 0.2
          },
          timestamp: new Date()
        });
        forecastData.push(forecast);
      }
    }
    console.log(`✅ Created ${forecastData.length} forecast records`);

    // STEP 7: Create Notifications (30 total - ALL types!)
console.log('\n🔔 Creating 30 notifications...');

const notificationTypes = [
  { type: 'donation_approved', title: 'Donation Approved!', icon: '✅' },
  { type: 'donation_accepted', title: 'NGO Accepted Your Donation!', icon: '🎁' },
  { type: 'pickup_scheduled', title: 'Pickup Scheduled!', icon: '🚚' },
  { type: 'request_accepted', title: 'Donor Accepted Your Request!', icon: '📋' },
  { type: 'request_fulfilled', title: 'Request Fulfilled!', icon: '🎉' },
  { type: 'new_match', title: 'New Donation Match Found!', icon: '🔗' },
  { type: 'feedback_received', title: 'New Feedback!', icon: '⭐' },
  { type: 'achievement_unlocked', title: 'Achievement Unlocked!', icon: '🏆' },
  { type: 'weekly_summary', title: 'Weekly Summary', icon: '📊' },
  { type: 'system_update', title: 'Platform Update', icon: '🔔' }
];

const notifications = [];
for (let i = 0; i < 30; i++) {
  const notificationType = notificationTypes[i % notificationTypes.length];
  const user = getRandomItem([...donors, ...ngos]);
  const relatedDonation = getRandomItem(donations);
  const relatedRequest = getRandomItem(requests);
  
  notifications.push(await Notification.create({
    user: user._id,
    type: notificationType.type,
    title: notificationType.title,
    message: `${notificationType.icon} ${generateNotificationMessage(notificationType.type, user.role)}`,
    icon: notificationType.icon,
    data: {
      donationId: relatedDonation._id,
      requestId: relatedRequest._id,
      url: `/dashboard?tab=${notificationType.type}`
    },
    isRead: Math.random() > 0.7, // 30% unread
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
}

console.log(`  ✅ Created ${notifications.length} notifications - 30% unread!`);

// Helper function for realistic messages
function generateNotificationMessage(type, role) {
  const messages = {
    donation_approved: 'Your donation has been approved by admin and is ready for pickup.',
    donation_accepted: `${getRandomItem(ngoNames)} has accepted your donation!`,
    pickup_scheduled: 'Pickup scheduled for tomorrow at 10 AM. Please be available.',
    request_accepted: 'Donor has accepted your clothing request!',
    request_fulfilled: 'Your request has been successfully fulfilled. 75 people helped!',
    new_match: 'AI found a perfect donation match for your request.',
    feedback_received: 'You received 5-star feedback on your donation!',
    achievement_unlocked: '🏆 First Donor Achievement Unlocked!',
    weekly_summary: 'You helped 150 people this week!',
    system_update: 'Platform update: Improved AI matching algorithm.'
  };
  return messages[type] || 'New notification received.';
}


    console.log('\n✨ Realistic Indian data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin: 1`);
    console.log(`   - Donors: ${donors.length}`);
    console.log(`   - NGOs: ${ngos.length}`);
    console.log(`   - Donations: ${donations.length}`);
    console.log(`   - Requests: ${requests.length}`);
    console.log(`   - Forecast Data: ${forecastData.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Admin: admin@rewearify.com / Admin@123`);
    console.log(`   Donor1: donor1@gmail.com / Admin@123`);
    console.log(`   NGO1: ngo1@rewearify.org / Admin@123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedRealisticData();
