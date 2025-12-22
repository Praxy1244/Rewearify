// backend/src/scripts/seedAll.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '../../.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

// ✅ Get MongoDB URI and validate IMMEDIATELY
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found!');
  process.exit(1);
}

console.log('✅ MongoDB URI loaded\n');

async function seedAll() {
  try {
    console.log('🌱 Starting complete database seed...\n');
    
    // ✅ Use the MONGODB_URI constant directly
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = (await import('../models/User.js')).default;
    const Donation = (await import('../models/Donation.js')).default;
    const bcrypt = (await import('bcryptjs')).default;

    // ==================== SEED USERS ====================
    console.log('='.repeat(50));
    console.log('STEP 1: Seeding Users');
    console.log('='.repeat(50));
    
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    const cities = [
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

    const users = [];
    
    // Create admin
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    users.push({
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

    // Create 20 donors
    const defaultPassword = await bcrypt.hash('Password@123', 12);
    const donorNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy',
      'Vikram Singh', 'Ananya Iyer', 'Rohan Mehta', 'Kavya Nair',
      'Arjun Desai', 'Meera Kulkarni', 'Sanjay Verma', 'Divya Joshi',
      'Karthik Rao', 'Neha Gupta', 'Aditya Malhotra', 'Pooja Kapoor',
      'Rahul Agarwal', 'Shreya Das', 'Varun Bansal', 'Isha Chatterjee'
    ];

    for (let i = 0; i < donorNames.length; i++) {
      const city = cities[i % cities.length];
      const randomOffset = () => (Math.random() - 0.5) * 0.1;
      
      users.push({
        name: donorNames[i],
        email: `donor${i + 1}@example.com`,
        password: defaultPassword,
        role: 'donor',
        location: {
          address: `${Math.floor(Math.random() * 500) + 1} Main Road`,
          city: city.name,
          state: city.state,
          country: 'India',
          zipCode: `${400000 + Math.floor(Math.random() * 99999)}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.coords[0] + randomOffset(), city.coords[1] + randomOffset()]
          }
        },
        contact: {
          phone: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`
        },
        verification: {
          isEmailVerified: true,
          isPhoneVerified: true
        },
        statistics: {
          totalDonations: Math.floor(Math.random() * 30),
          totalRequests: 0
        },
        status: 'active'
      });
    }

    // Create 50 NGOs
    const ngoNames = ['Hope Foundation', 'Seva Trust', 'Care India', 'Helping Hands', 'Smile Foundation'];
    let ngoCount = 0;
    
    for (const city of cities) {
      for (let i = 0; i < 5; i++) {
        const randomOffset = () => (Math.random() - 0.5) * 0.15;
        
        users.push({
          name: `${ngoNames[i]} - ${city.name}`,
          email: `ngo${ngoCount + 1}@example.com`,
          password: defaultPassword,
          role: 'recipient',
          location: {
            address: `${Math.floor(Math.random() * 200) + 1} Society Lane`,
            city: city.name,
            state: city.state,
            country: 'India',
            zipCode: `${400000 + Math.floor(Math.random() * 99999)}`,
            coordinates: {
              type: 'Point',
              coordinates: [city.coords[0] + randomOffset(), city.coords[1] + randomOffset()]
            }
          },
          contact: {
            phone: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`
          },
          organization: {
            name: `${ngoNames[i]} - ${city.name}`,
            type: 'NGO',
            registrationNumber: `REG${Math.floor(100000 + Math.random() * 900000)}`
          },
          verification: {
            isEmailVerified: true,
            isPhoneVerified: true,
            isOrganizationVerified: true
          },
          statistics: {
            totalRequests: Math.floor(Math.random() * 50)
          },
          status: 'active'
        });
        ngoCount++;
      }
    }

    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Created ${insertedUsers.length} users`);
    console.log(`   - 1 Admin`);
    console.log(`   - ${donorNames.length} Donors`);
    console.log(`   - ${ngoCount} NGOs\n`);

    // ==================== SEED DONATIONS ====================
    console.log('='.repeat(50));
    console.log('STEP 2: Seeding Donations');
    console.log('='.repeat(50));

    await Donation.deleteMany({});
    console.log('🗑️  Cleared existing donations');

    const donors = insertedUsers.filter(u => u.role === 'donor');
    const donations = [];
    
    const categories = ['outerwear', 'formal', 'casual', 'children', 'household'];
    const seasons = ['Summer', 'Winter', 'Monsoon', 'All Season'];
    const conditions = ['excellent', 'good', 'fair'];

    // Create 200 donations
    for (let i = 0; i < 200; i++) {
      const donor = donors[Math.floor(Math.random() * donors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const createdAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      
      donations.push({
        donor: donor._id,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Donation ${i + 1}`,
        description: 'Gently used, in great condition. Clean and ready for use.',
        category,
        subcategory: category,
        season: seasons[Math.floor(Math.random() * seasons.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        quantity: Math.floor(Math.random() * 20) + 1,
        sizes: [{ size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)], quantity: 5 }],
        location: donor.location,
        availability: {
          pickupAvailable: true,
          deliveryRadius: 15
        },
        preferences: { urgentNeeded: Math.random() > 0.8 },
        tags: [category],
        status: ['completed', 'approved', 'pending', 'matched'][Math.floor(Math.random() * 4)],
        createdAt,
        updatedAt: createdAt,
        aiAnalysis: {
          fraudScore: Math.random() * 0.3,
          qualityScore: 0.7 + Math.random() * 0.3,
          demandPrediction: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        },
        riskScore: Math.random() * 0.3,
        riskLevel: 'low'
      });
    }

    const insertedDonations = await Donation.insertMany(donations);
    console.log(`✅ Created ${insertedDonations.length} donations`);
    
    const statusCounts = insertedDonations.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Status breakdown:', statusCounts);

        // ==================== SEED REQUESTS ====================
    console.log('='.repeat(50));
    console.log('STEP 3: Seeding Requests');
    console.log('='.repeat(50));

    const Request = (await import('../models/Request.js')).default;
    await Request.deleteMany({});
    console.log('🗑️  Cleared existing requests');

    const recipients = insertedUsers.filter(u => u.role === 'recipient');
    
    const requestCategories = {
      outerwear: {
        subcategories: ['Jacket', 'Coat', 'Sweater', 'Vest'],
        titles: ['Winter Jackets Needed', 'Warm Coats Required', 'Sweaters for Children'],
      },
      formal: {
        subcategories: ['Suit', 'Dress Shirt', 'Blouse', 'Trousers'],
        titles: ['Professional Attire Needed', 'Business Clothing Required'],
      },
      casual: {
        subcategories: ['T-Shirt', 'Jeans', 'Kurta'],
        titles: ['Everyday Clothing Needed', 'Casual Wear Required'],
      },
      children: {
        subcategories: ['Infant Set', 'Toddler Outfit', 'Youth T-Shirt'],
        titles: ['Children Clothing Needed', 'Kids Wear Required'],
      },
      household: {
        subcategories: ['Blanket', 'Bedsheet', 'Towel'],
        titles: ['Blankets Needed', 'Household Linens Required'],
      }
    };

    const requests = [];
    const urgencyLevels = ['low', 'medium', 'high'];

    for (let i = 0; i < 100; i++) {
      const recipient = recipients[i % recipients.length];
      const categoryKeys = Object.keys(requestCategories);
      const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      const categoryData = requestCategories[category];
      
      const subcategory = categoryData.subcategories[Math.floor(Math.random() * categoryData.subcategories.length)];
      const title = categoryData.titles[Math.floor(Math.random() * categoryData.titles.length)];
      
      const quantity = Math.floor(Math.random() * 50) + 10;
      const quantityReceived = Math.random() > 0.7 ? Math.floor(Math.random() * quantity * 0.5) : 0;
      
      let status = 'active';
      if (quantityReceived >= quantity) status = 'completed';
      else if (quantityReceived > 0) status = 'partially_fulfilled';
      
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      requests.push({
        requester: recipient._id,
        title,
        description: `We urgently need ${subcategory}s for our community program.`,
        category,
        subcategory,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        quantity,
        quantityReceived,
        sizes: [{ size: 'Various', quantity }],
        condition: {
          acceptable: ['excellent', 'good', 'fair'],
          minimum: 'fair'
        },
        beneficiaries: {
          count: Math.floor(Math.random() * 200) + 20,
          ageGroup: 'mixed',
          gender: 'mixed'
        },
        location: recipient.location,
        timeline: {
          neededBy: new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000),
          flexible: true
        },
        logistics: {
          canPickup: true,
          pickupRadius: 25,
          needsDelivery: false,
          hasTransport: false
        },
        status,
        createdAt,
        updatedAt: new Date(),
        visibility: 'public'
      });
    }

    const insertedRequests = await Request.insertMany(requests);
    console.log(`✅ Created ${insertedRequests.length} requests`);
    
    const requestStatusCounts = insertedRequests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Status breakdown:', requestStatusCounts);


       // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Users: ${insertedUsers.length}`);
    console.log(`   Total Donations: ${insertedDonations.length}`);
    console.log(`   Total Requests: ${insertedRequests.length}\n`);  // ✅ ADD THIS
    console.log('✅ Ready to test AI models!\n');


    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedAll();
