/**
 * Fix NGO Locations Script (FINAL)
 *
 * Corrects NGO location.city, state, and coordinates
 * based on city name present at the END of NGO name
 *
 * Example:
 * "Seva Trust Delhi" → Delhi coordinates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify';

// 🔑 SINGLE SOURCE OF TRUTH
const CITY_DATA = {
  Mumbai: { state: 'Maharashtra', coords: [72.8777, 19.0760] },
  Delhi: { state: 'Delhi', coords: [77.1025, 28.7041] },
  Bengaluru: { state: 'Karnataka', coords: [77.5946, 12.9716] },
  Hyderabad: { state: 'Telangana', coords: [78.4867, 17.3850] },
  Chennai: { state: 'Tamil Nadu', coords: [80.2707, 13.0827] },
  Kolkata: { state: 'West Bengal', coords: [88.3639, 22.5726] },
  Pune: { state: 'Maharashtra', coords: [73.8567, 18.5204] },
  Ahmedabad: { state: 'Gujarat', coords: [72.5714, 23.0225] },
  Jaipur: { state: 'Rajasthan', coords: [75.7873, 26.9124] },
  Mysuru: { state: 'Karnataka', coords: [76.6394, 12.2958] }
};

// Extract city from NGO name suffix
function extractCity(name) {
  return Object.keys(CITY_DATA).find(city =>
    name.toLowerCase().endsWith(city.toLowerCase())
  );
}

async function fixNGOLocations() {
  try {
    console.log('\n================================================');
    console.log('🔧 FIXING NGO LOCATIONS (FINAL)');
    console.log('================================================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const ngos = await User.find({ role: 'recipient' });
    console.log(`📊 NGOs found: ${ngos.length}\n`);

    let fixed = 0;
    let skipped = 0;

    for (const ngo of ngos) {
      const city = extractCity(ngo.name);

      if (!city) {
        console.log(`⚠️  Skipped: ${ngo.name} (city not found)`);
        skipped++;
        continue;
      }

      const currentCity = ngo.location?.city;
      if (currentCity === city) {
        skipped++;
        continue;
      }

      const { state, coords } = CITY_DATA[city];

      await User.findByIdAndUpdate(
        ngo._id,
        {
          $set: {
            'location.city': city,
            'location.state': state,
            'location.country': 'India',
            'location.coordinates': {
              type: 'Point',
              coordinates: coords
            }
          }
        },
        { runValidators: true }
      );

      console.log(`✅ Fixed: ${ngo.name}`);
      console.log(`   ${currentCity || 'Unknown'} → ${city}\n`);
      fixed++;
    }

    console.log('================================================');
    console.log('📊 SUMMARY');
    console.log('================================================');
    console.log(`Total NGOs: ${ngos.length}`);
    console.log(`Fixed:     ${fixed}`);
    console.log(`Skipped:   ${skipped}`);
    console.log('================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  }
}

fixNGOLocations();
