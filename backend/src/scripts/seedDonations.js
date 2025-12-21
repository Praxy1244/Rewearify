import mongoose from 'mongoose';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ✅ FIX: Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });


const categories = ['outerwear', 'formal', 'casual', 'children', 'accessories', 'shoes', 'traditional', 'household'];
const seasons = ['Summer', 'Winter', 'Monsoon', 'All Season'];
const conditions = ['excellent', 'good', 'fair'];
const statuses = ['completed', 'approved', 'pending', 'matched', 'flagged'];

const titles = {
  outerwear: ['Winter Jackets', 'Warm Coats', 'Sweaters Collection', 'Hoodies Set'],
  formal: ['Business Suits', 'Dress Shirts', 'Formal Trousers', 'Office Wear'],
  casual: ['T-Shirts Bundle', 'Jeans Collection', 'Casual Wear Set', 'Daily Wear Clothes'],
  children: ['Kids Clothing', 'School Uniforms', 'Children Wear', 'Baby Clothes'],
  accessories: ['Bags and Belts', 'Scarves Collection', 'Accessories Bundle'],
  shoes: ['Footwear Collection', 'School Shoes', 'Sandals Set', 'Boots Bundle'],
  traditional: ['Sarees Collection', 'Kurta Set', 'Ethnic Wear', 'Traditional Outfits'],
  household: ['Blankets', 'Bed Sheets', 'Towels Set', 'Household Linens']
};

const descriptions = [
  'Gently used, in great condition. Clean and well-maintained.',
  'Like new condition. Perfect for someone in need.',
  'Good quality items. Washed and ready to use.',
  'Well-maintained collection. Suitable for all ages.',
  'Excellent condition. Barely used items.',
  'Quality items from good brands. Still have lots of life left.',
  'Clean and hygienic. Ready for immediate use.',
  'Slightly used but in very good shape.'
];

async function seedDonations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Get donors and NGOs
    const donors = await User.find({ role: 'donor' }).select('_id location statistics');
    const ngos = await User.find({ role: 'recipient' }).select('_id');

    if (donors.length === 0) {
      console.log('⚠️  No donors found. Run seedUsers.js first!');
      process.exit(1);
    }

    // Clear existing donations
    await Donation.deleteMany({});
    console.log('🗑️  Cleared existing donations');

    const donations = [];
    const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    // ==================== CREATE HISTORICAL DONATIONS ====================
    // Each donor gets 1-50 historical donations based on their totalDonations
    for (const donor of donors) {
      const numDonations = donor.statistics?.totalDonations || Math.floor(Math.random() * 20);
      
      for (let i = 0; i < numDonations; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const season = seasons[Math.floor(Math.random() * seasons.length)];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Historical donations are mostly completed
        const statusWeights = [0.7, 0.15, 0.1, 0.05]; // completed, approved, matched, flagged
        const rand = Math.random();
        let status;
        if (rand < statusWeights[0]) status = 'completed';
        else if (rand < statusWeights[0] + statusWeights[1]) status = 'approved';
        else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = 'matched';
        else status = 'flagged';
        
        const createdAt = new Date(startDate.getTime() + Math.random() * 150 * 24 * 60 * 60 * 1000);
        const quantity = Math.floor(Math.random() * 20) + 1;
        
        const donation = {
          donor: donor._id,
          title: titles[category][Math.floor(Math.random() * titles[category].length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          category,
          subcategory: titles[category][0].split(' ')[0],
          season,
          condition,
          quantity,
          sizes: [
            { size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)], quantity: Math.floor(quantity / 2) + 1 }
          ],
          location: donor.location,
          availability: {
            pickupAvailable: true,
            deliveryRadius: Math.floor(Math.random() * 20) + 5
          },
          preferences: {
            urgentNeeded: Math.random() > 0.8
          },
          tags: [category, season],
          status,
          createdAt,
          updatedAt: createdAt,
          aiAnalysis: {
            fraudScore: Math.random() * 0.3, // Low fraud scores for completed
            qualityScore: 0.6 + Math.random() * 0.4,
            demandPrediction: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
          },
          riskScore: Math.random() * 0.3,
          riskLevel: 'low'
        };

        // Add completion data for completed donations
        if (status === 'completed') {
          donation.completedAt = new Date(createdAt.getTime() + (5 + Math.random() * 10) * 24 * 60 * 60 * 1000);
          donation.completion = {
            completedAt: donation.completedAt,
            feedback: {
              rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
              comment: 'Great donation, helped many people!'
            }
          };
        }

        // Add flag data for flagged donations
        if (status === 'flagged') {
          donation.isFlagged = true;
          donation.flagReason = 'Suspicious quantity or pattern';
          donation.riskScore = 0.7 + Math.random() * 0.3;
          donation.riskLevel = 'high';
        }

        donations.push(donation);
      }
    }

    console.log(`📦 Created ${donations.length} historical donations`);

    // ==================== CREATE CURRENT DONATIONS ====================
    // Create 20-30 recent donations in various states
    for (let i = 0; i < 25; i++) {
      const donor = donors[Math.floor(Math.random() * donors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const season = seasons[Math.floor(Math.random() * seasons.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const status = ['pending', 'approved', 'matched'][Math.floor(Math.random() * 3)];
      
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const quantity = Math.floor(Math.random() * 15) + 1;
      
      donations.push({
        donor: donor._id,
        title: titles[category][Math.floor(Math.random() * titles[category].length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category,
        subcategory: titles[category][0].split(' ')[0],
        season,
        condition,
        quantity,
        sizes: [
          { size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)], quantity }
        ],
        location: donor.location,
        availability: {
          pickupAvailable: true,
          deliveryRadius: Math.floor(Math.random() * 20) + 5
        },
        preferences: {
          urgentNeeded: Math.random() > 0.7
        },
        tags: [category, season],
        status,
        createdAt,
        updatedAt: createdAt,
        aiAnalysis: {
          fraudScore: Math.random() * 0.4,
          qualityScore: 0.5 + Math.random() * 0.5,
          demandPrediction: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        },
        riskScore: Math.random() * 0.4,
        riskLevel: Math.random() > 0.8 ? 'medium' : 'low'
      });
    }

    console.log(`📦 Created 25 current donations`);

    // Insert all donations
    const insertedDonations = await Donation.insertMany(donations);
    console.log(`✅ Total donations inserted: ${insertedDonations.length}`);
    console.log(`   Status breakdown:`);
    console.log(`   - Completed: ${insertedDonations.filter(d => d.status === 'completed').length}`);
    console.log(`   - Approved: ${insertedDonations.filter(d => d.status === 'approved').length}`);
    console.log(`   - Pending: ${insertedDonations.filter(d => d.status === 'pending').length}`);
    console.log(`   - Matched: ${insertedDonations.filter(d => d.status === 'matched').length}`);
    console.log(`   - Flagged: ${insertedDonations.filter(d => d.status === 'flagged').length}`);

    mongoose.connection.close();
    console.log('✅ Donation seed completed!');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDonations().then(() => process.exit(0));
}

export default seedDonations;
