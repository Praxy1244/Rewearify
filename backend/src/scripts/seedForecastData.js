import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Donation from '../models/Donation.js';
import User from '../models/User.js';

dotenv.config();

// Valid categories from your schema
const categories = ['outerwear', 'formal', 'casual', 'children', 'accessories', 'shoes', 'activewear', 'traditional', 'seasonal'];
const conditions = ['excellent', 'good', 'fair', 'poor'];
const seasons = ['Summer', 'Winter', 'Monsoon', 'All Season'];
const statuses = ['completed', 'delivered', 'approved'];

const cities = [
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 }
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Grey', 'Brown', 'Pink', 'Yellow', 'Purple'];

// Generate random date within last 90 days
const randomDate = (daysAgo = 90) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate donation title based on category
const generateTitle = (category, condition) => {
  const titles = {
    'outerwear': ['Winter Jacket', 'Rain Coat', 'Windbreaker', 'Parka', 'Blazer'],
    'formal': ['Business Suit', 'Dress Shirt', 'Formal Trousers', 'Blazer', 'Office Wear'],
    'casual': ['T-Shirt', 'Jeans', 'Casual Shirt', 'Shorts', 'Polo Shirt'],
    'children': ['Kids Dress', 'School Uniform', 'Baby Clothes', 'Toddler Outfit', 'Kids Shoes'],
    'accessories': ['Scarf', 'Belt', 'Hat', 'Gloves', 'Bag'],
    'shoes': ['Sneakers', 'Formal Shoes', 'Sandals', 'Boots', 'Slippers'],
    'activewear': ['Sports T-Shirt', 'Gym Shorts', 'Running Shoes', 'Track Pants', 'Sports Bra'],
    'traditional': ['Saree', 'Kurta', 'Sherwani', 'Lehenga', 'Dhoti'],
    'seasonal': ['Summer Dress', 'Winter Sweater', 'Monsoon Jacket', 'Light Cotton Shirt']
  };
  
  const itemName = randomItem(titles[category] || ['Clothing Item']);
  return `${condition.charAt(0).toUpperCase() + condition.slice(1)} ${itemName}`;
};

// Generate description
const generateDescription = (category, condition) => {
  const descriptions = [
    `Well-maintained ${category} in ${condition} condition. Perfect for donation.`,
    `${condition.charAt(0).toUpperCase() + condition.slice(1)} quality ${category} items. Ready to donate.`,
    `Gently used ${category}. Clean and ready for a new home.`,
    `High-quality ${category} in ${condition} condition. Donating to help others.`,
    `${condition.charAt(0).toUpperCase() + condition.slice(1)} ${category}. All items are clean and washed.`
  ];
  return randomItem(descriptions);
};

const seedForecastData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Find or create a donor user
    let donor = await User.findOne({ role: 'donor' });
    if (!donor) {
      console.log('⚠️  No donor user found. Creating seed donor...');
      donor = await User.create({
        name: 'Seed Donor',
        email: 'donor@seed.com',
        password: 'password123',
        role: 'donor',
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India'
        }
      });
      console.log('✅ Created seed donor user');
    }

    console.log(`Using donor: ${donor.name} (${donor._id})`);

    // Clear existing test donations (optional)
    // await Donation.deleteMany({ donor: donor._id });
    // console.log('🗑️  Cleared existing seed donations');

    const donations = [];

    // Generate 500 sample donations over last 90 days
    console.log('🔄 Generating 500 donations...');
    
    for (let i = 0; i < 500; i++) {
      const category = randomItem(categories);
      const condition = randomItem(conditions);
      const city = randomItem(cities);
      const season = randomItem(seasons);
      const status = randomItem(statuses);
      const createdDate = randomDate(90);
      
      const donation = {
        donor: donor._id,
        title: generateTitle(category, condition),
        description: generateDescription(category, condition),
        category: category,
        subcategory: '',
        season: season,
        condition: condition,
        quantity: Math.floor(Math.random() * 20) + 1,
        sizes: [
          {
            size: randomItem(sizes),
            quantity: Math.floor(Math.random() * 10) + 1
          }
        ],
        colors: [randomItem(colors), randomItem(colors)],
        brand: ['Nike', 'Adidas', 'Zara', 'H&M', 'Levis', 'Uniqlo', 'Local Brand', ''][Math.floor(Math.random() * 8)],
        originalPrice: Math.floor(Math.random() * 5000) + 500,
        status: status,
        location: {
          address: `${Math.floor(Math.random() * 999) + 1}, ${city.name}`,
          city: city.name,
          state: city.state,
          country: 'India',
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: {
            type: 'Point',
            coordinates: [city.lng, city.lat]
          }
        },
        availability: {
          pickupAvailable: true,
          deliveryAvailable: Math.random() > 0.5,
          deliveryRadius: Math.floor(Math.random() * 20) + 5,
          availableFrom: createdDate
        },
        preferences: {
          urgentNeeded: Math.random() > 0.8,
          preferredRecipients: [],
          restrictions: [],
          specialInstructions: ''
        },
        tags: [category, season.toLowerCase(), condition],
        aiAnalysis: {
          categoryConfidence: Math.random() * 0.3 + 0.7,
          conditionScore: Math.random() * 0.4 + 0.6,
          demandPrediction: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          fraudScore: Math.random() * 0.2,
          qualityScore: Math.random() * 0.3 + 0.7
        },
        analytics: {
          viewCount: Math.floor(Math.random() * 100),
          inquiryCount: Math.floor(Math.random() * 20),
          shareCount: Math.floor(Math.random() * 10)
        },
        createdAt: createdDate,
        updatedAt: createdDate
      };

      // Add completion date if status is completed
      if (status === 'completed') {
        donation.completedAt = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        donation.completion = {
          completedAt: donation.completedAt,
          feedback: {
            rating: Math.floor(Math.random() * 2) + 4 // 4 or 5 stars
          }
        };
      }

      // Add delivery date if status is delivered
      if (status === 'delivered') {
        donation.deliveredAt = new Date(createdDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
      }

      // Add approval date if status is approved
      if (status === 'approved') {
        donation.approvedAt = new Date(createdDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        donation.moderation = {
          approvedAt: donation.approvedAt
        };
      }

      donations.push(donation);
      
      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`   Generated ${i + 1}/500 donations...`);
      }
    }

    console.log('💾 Saving donations to database...');
    await Donation.insertMany(donations);
    console.log(`✅ Successfully seeded ${donations.length} donations`);
    console.log('📈 Forecast data is now available!');

    // Show summary
    const summary = await Donation.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgQuantity: { $avg: '$quantity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📊 Seeded Data Summary by Category:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summary.forEach(item => {
      console.log(`   ${item._id.padEnd(15)} : ${item.count.toString().padStart(3)} donations (avg qty: ${Math.round(item.avgQuantity)})`);
    });

    // City summary
    const citySummary = await Donation.aggregate([
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📍 Seeded Data Summary by City:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    citySummary.forEach(item => {
      console.log(`   ${item._id.padEnd(15)} : ${item.count.toString().padStart(3)} donations`);
    });

    // Status summary
    const statusSummary = await Donation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📋 Seeded Data Summary by Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    statusSummary.forEach(item => {
      console.log(`   ${item._id.padEnd(15)} : ${item.count.toString().padStart(3)} donations`);
    });

    console.log('\n✨ Database seeding complete!');
    console.log('🎯 You can now test the forecast feature with real data.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
};

seedForecastData();
