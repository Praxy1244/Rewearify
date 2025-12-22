/**
 * Fix NGO Locations Script
 * 
 * Updates existing NGO users with proper location coordinates and clustering data.
 * This script adds sample data to existing recipients so clustering can work.
 * 
 * Usage:
 *   node backend/src/scripts/fixNGOLocations.js
 * 
 * Or from package.json:
 *   npm run fix:ngo-locations
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Sample location data for Karnataka cities
const SAMPLE_LOCATIONS = [
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    coordinates: [77.5946, 12.9716], // [longitude, latitude]
    zipCode: '560001'
  },
  {
    city: 'Mysuru',
    state: 'Karnataka',
    country: 'India',
    coordinates: [76.6394, 12.2958],
    zipCode: '570001'
  },
  {
    city: 'Mangaluru',
    state: 'Karnataka',
    country: 'India',
    coordinates: [74.8560, 12.9141],
    zipCode: '575001'
  },
  {
    city: 'Hubballi',
    state: 'Karnataka',
    country: 'India',
    coordinates: [75.1240, 15.3647],
    zipCode: '580020'
  }
];

// Sample clustering profile data
const SAMPLE_PROFILES = [
  {
    specialFocus: ["Men's Wear", "Women's Wear", "Winter Wear"],
    capacityPerWeek: 250,
    urgentNeed: true,
    cause: 'Education',
    operatingHours: '9 AM - 6 PM',
    preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  {
    specialFocus: ["Kids Wear", "Women's Wear"],
    capacityPerWeek: 180,
    urgentNeed: false,
    cause: 'Child Welfare',
    operatingHours: '10 AM - 4 PM',
    preferredDays: ['Monday', 'Wednesday', 'Friday', 'Saturday']
  },
  {
    specialFocus: ["All types"],
    capacityPerWeek: 400,
    urgentNeed: true,
    cause: 'Poverty',
    operatingHours: '8 AM - 7 PM',
    preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    specialFocus: ["Women's Wear", "Accessories"],
    capacityPerWeek: 150,
    urgentNeed: false,
    cause: 'Women Empowerment',
    operatingHours: '9 AM - 5 PM',
    preferredDays: ['Tuesday', 'Thursday', 'Saturday']
  }
];

class NGOLocationFixer {
  constructor() {
    this.stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify';
      console.log('\n🔌 Connecting to MongoDB...');
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB\n');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  async fixNGOLocations() {
    try {
      console.log('============================================================');
      console.log('🔧 FIXING NGO LOCATIONS & CLUSTERING DATA');
      console.log('============================================================\n');

      // Fetch all recipient users
      console.log('📊 Fetching recipient users...');
      const recipients = await User.find({ role: 'recipient' });
      
      this.stats.total = recipients.length;
      console.log(`   Found ${recipients.length} recipient users\n`);

      if (recipients.length === 0) {
        console.log('⚠️  No recipient users found!\n');
        return;
      }

      console.log('🔄 Updating NGO data...\n');

      // Update each NGO
      for (let i = 0; i < recipients.length; i++) {
        const ngo = recipients[i];
        const locationData = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length];
        const profileData = SAMPLE_PROFILES[i % SAMPLE_PROFILES.length];

        try {
          // Update location
          ngo.location = {
            address: `${i + 1}, Sample Street, ${locationData.city}`,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country,
            zipCode: locationData.zipCode,
            coordinates: {
              type: 'Point',
              coordinates: locationData.coordinates
            }
          };

          // Update recipient profile
          ngo.recipientProfile = profileData;

          // Set organization data if missing
          if (!ngo.organization || !ngo.organization.name) {
            ngo.organization = {
              name: ngo.name,
              type: 'NGO',
              registrationNumber: `REG${Date.now()}${i}`
            };
          }

          await ngo.save();

          console.log(`✅ Updated: ${ngo.name}`);
          console.log(`   Location: ${locationData.city}, Karnataka`);
          console.log(`   Coordinates: [${locationData.coordinates.join(', ')}]`);
          console.log(`   Capacity: ${profileData.capacityPerWeek} items/week`);
          console.log(`   Special Focus: ${profileData.specialFocus.join(', ')}`);
          console.log(`   Cause: ${profileData.cause}`);
          console.log(`   Urgent Need: ${profileData.urgentNeed ? 'Yes' : 'No'}\n`);

          this.stats.updated++;
        } catch (error) {
          console.error(`❌ Error updating ${ngo.name}:`, error.message);
          this.stats.errors++;
        }
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Error fixing locations:', error.message);
      throw error;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total NGOs:              ${this.stats.total}`);
    console.log(`Successfully updated:    ${this.stats.updated}`);
    console.log(`Skipped:                 ${this.stats.skipped}`);
    console.log(`Errors:                  ${this.stats.errors}`);
    console.log('='.repeat(60) + '\n');

    if (this.stats.updated > 0) {
      console.log('✅ NGO locations fixed successfully!\n');
      console.log('🔄 Next steps:');
      console.log('   1. Run: npm run sync:ngos');
      console.log('   2. Verify CSV file created with valid coordinates');
      console.log('   3. Test clustering feature\n');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.fixNGOLocations();
      await mongoose.connection.close();
      console.log('🔌 Database connection closed\n');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Script failed:', error);
      await mongoose.connection.close();
      process.exit(1);
    }
  }
}

// Run the script
const fixer = new NGOLocationFixer();
fixer.run();

export default NGOLocationFixer;
