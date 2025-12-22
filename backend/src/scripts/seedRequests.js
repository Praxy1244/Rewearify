// backend/src/scripts/seedRequests.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function seedRequests() {
  try {
    console.log('🌱 Starting Request Seeding...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = (await import('../models/User.js')).default;
    const Request = (await import('../models/Request.js')).default;

    // Get all NGOs
    const ngos = await User.find({ role: 'recipient' });
    console.log(`📋 Found ${ngos.length} NGOs\n`);

    if (ngos.length === 0) {
      console.log('⚠️  No NGOs found. Please run seedAll.js first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Clear existing requests
    await Request.deleteMany({});
    console.log('🗑️  Cleared existing requests\n');

    // Request templates
    const categories = {
      outerwear: {
        subcategories: ['Jacket', 'Coat', 'Sweater', 'Vest'],
        titles: [
          'Winter Jackets Needed for Homeless Shelter',
          'Warm Coats Required for Cold Weather Relief',
          'Sweaters Needed for Children',
          'Urgent: Winter Wear for Families'
        ],
        descriptions: [
          'We urgently need winter jackets for our homeless shelter serving 200+ individuals.',
          'Our organization requires warm coats to distribute to low-income families this winter.',
          'Seeking sweaters and warm clothing for children in our after-school program.',
          'Winter is approaching and we need help providing warmth to families in need.'
        ]
      },
      formal: {
        subcategories: ['Suit', 'Dress Shirt', 'Blouse', 'Trousers', 'Skirt'],
        titles: [
          'Professional Attire for Job Seekers',
          'Business Clothing Needed for Employment Program',
          'Suits Required for Interview Preparation',
          'Work-Appropriate Clothing for Career Training'
        ],
        descriptions: [
          'Our job readiness program needs professional clothing to help individuals secure employment.',
          'We are preparing 50+ people for job interviews and need business attire.',
          'Seeking suits and professional wear for our workforce development initiative.',
          'Help us provide appropriate work clothing for people re-entering the workforce.'
        ]
      },
      casual: {
        subcategories: ['T-Shirt', 'Jeans', 'Kurta', 'Shorts', 'Polo Shirt'],
        titles: [
          'Everyday Clothing for Families',
          'Casual Wear Needed for Community Program',
          'Basic Clothing for Low-Income Families',
          'T-Shirts and Jeans Required'
        ],
        descriptions: [
          'We serve 100+ families who need basic everyday clothing for daily activities.',
          'Our community center requires casual wear for distribution to families in need.',
          'Seeking comfortable everyday clothing for children and adults.',
          'Help us provide basic clothing essentials to those facing financial hardship.'
        ]
      },
      children: {
        subcategories: ['Infant Set', 'Toddler Outfit', 'Youth T-Shirt', 'Youth Jeans'],
        titles: [
          "Children's Clothing for School Program",
          'Kids Wear Needed for Growing Families',
          'School Uniforms and Children Clothing Required',
          'Urgent: Clothing for Children in Care'
        ],
        descriptions: [
          'Our school program serves 150+ children who need appropriate clothing for school.',
          'Families with growing children urgently need kids clothing in various sizes.',
          'We need children\'s clothing for our youth development program.',
          'Help us provide clothing for children in foster care and group homes.'
        ]
      },
      household: {
        subcategories: ['Blanket', 'Bedsheet', 'Towel', 'Curtain'],
        titles: [
          'Blankets Needed for Winter Relief',
          'Bedding Required for Housing Program',
          'Household Linens for New Homes',
          'Blankets and Towels for Shelter'
        ],
        descriptions: [
          'We need blankets and warm bedding for families experiencing homelessness.',
          'Our housing program helps families transition to stable homes - we need household items.',
          'Seeking blankets, bedsheets, and towels for refugee families.',
          'Help us provide basic household essentials to families in our shelter.'
        ]
      },
      activewear: {
        subcategories: ['Sportswear', 'Tracksuit', 'Swimwear'],
        titles: [
          'Sports Clothing for Youth Program',
          'Athletic Wear Needed for Fitness Initiative',
          'Sportswear Required for School Teams',
          'Active Wear for Community Sports'
        ],
        descriptions: [
          'Our youth sports program needs athletic wear for 80+ children.',
          'We run a community fitness program serving underprivileged youth - sports clothing needed.',
          'Help us provide sportswear for school teams that lack funding.',
          'Active wear needed for our community health and wellness initiative.'
        ]
      },
      traditional: {
        subcategories: ['Saree', 'Kurta Pajama', 'Lehenga', 'Sherwani'],
        titles: [
          'Traditional Clothing for Cultural Events',
          'Festival Wear Needed for Community',
          'Traditional Attire for Religious Ceremonies',
          'Cultural Clothing for Immigrant Families'
        ],
        descriptions: [
          'We need traditional clothing for cultural celebrations and religious events.',
          'Our community center serves immigrant families who need traditional attire.',
          'Help us provide cultural clothing for festival celebrations.',
          'Seeking traditional wear for families maintaining cultural traditions.'
        ]
      }
    };

    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    const validStatuses = ['active', 'matched', 'fulfilled', 'expired']; // ✅ FIXED
    const requests = [];

    // Create 100 requests distributed across NGOs
    for (let i = 0; i < 100; i++) {
      const ngo = ngos[i % ngos.length];
      const categoryKeys = Object.keys(categories);
      const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      const categoryData = categories[category];
      
      const subcategory = categoryData.subcategories[Math.floor(Math.random() * categoryData.subcategories.length)];
      const title = categoryData.titles[Math.floor(Math.random() * categoryData.titles.length)];
      const description = categoryData.descriptions[Math.floor(Math.random() * categoryData.descriptions.length)];
      
      const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 items
      
      // ✅ FIXED: Use valid status values
      const statusWeights = [0.6, 0.15, 0.2, 0.05]; // 60% active, 15% matched, 20% fulfilled, 5% expired
      const rand = Math.random();
      let status;
      if (rand < statusWeights[0]) status = 'active';
      else if (rand < statusWeights[0] + statusWeights[1]) status = 'matched';
      else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = 'fulfilled';
      else status = 'expired';
      
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
      const neededBy = new Date(createdAt.getTime() + (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000); // 30-90 days from creation
      
      const requestData = {
        requester: ngo._id,
        title,
        description,
        category,
        subcategory,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        quantity,
        sizes: [
          { size: ['S', 'M', 'L', 'XL', 'Various'][Math.floor(Math.random() * 5)], quantity: Math.floor(quantity / 2) }
        ],
        condition: {
          acceptable: ['excellent', 'good', 'fair'].slice(0, Math.floor(Math.random() * 2) + 1),
          minimum: 'fair'
        },
        beneficiaries: {
          count: Math.floor(Math.random() * 200) + 20,
          ageGroup: ['children', 'adults', 'elderly', 'mixed'][Math.floor(Math.random() * 4)],
          gender: ['male', 'female', 'mixed'][Math.floor(Math.random() * 3)]
        },
        location: ngo.location,
        timeline: {
          neededBy,
          flexible: Math.random() > 0.5
        },
        logistics: {
          canPickup: true,
          pickupRadius: 25,
          needsDelivery: Math.random() > 0.7,
          hasTransport: Math.random() > 0.5
        },
        status,
        createdAt,
        updatedAt: new Date(),
        tags: [category, subcategory],
        expiresAt: new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000)
      };

      // ✅ Add fulfillment data if fulfilled
      if (status === 'fulfilled') {
        requestData.fulfillment = {
          fulfilledAt: new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          feedback: {
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            comment: 'Thank you for the wonderful donation!'
          }
        };
      }

      // ✅ Add matching data if matched
      if (status === 'matched') {
        requestData.matching = {
          matchedAt: new Date(createdAt.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000),
          matchScore: 0.7 + Math.random() * 0.3,
          autoMatched: Math.random() > 0.5
        };
      }

      requests.push(requestData);
    }

    const insertedRequests = await Request.insertMany(requests);
    console.log(`✅ Created ${insertedRequests.length} requests\n`);

    // Status breakdown
    const statusCounts = insertedRequests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Category breakdown
    const categoryCounts = insertedRequests.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Category breakdown:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    // Urgency breakdown
    const urgencyCounts = insertedRequests.reduce((acc, r) => {
      acc[r.urgency] = (acc[r.urgency] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Urgency breakdown:');
    Object.entries(urgencyCounts).forEach(([urgency, count]) => {
      console.log(`   ${urgency}: ${count}`);
    });

    console.log('\n✅ Request seeding complete!\n');

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

seedRequests();
