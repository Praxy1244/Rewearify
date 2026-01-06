/**
 * Fix NGO Cities Script
 * Fixes NGO location.city, state, and coordinates
 * by extracting city name from NGO name suffix
 *
 * Example:
 * "Seva Trust Delhi" → city = "Delhi"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify';

// City mapping
const CITY_COORDINATES = {
  Mumbai: { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  Delhi: { lat: 28.7041, lng: 77.1025, state: 'Delhi' },
  Bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  Hyderabad: { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  Chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  Kolkata: { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  Pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  Jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  Mysuru: { lat: 12.2958, lng: 76.6394, state: 'Karnataka' }
};

// Extract city from end of NGO name
function extractCityFromName(name) {
  return Object.keys(CITY_COORDINATES).find(city =>
    name.toLowerCase().endsWith(city.toLowerCase())
  );
}

async function fixNGOCities() {
  try {
    console.log('\n==============================');
    console.log('🔧 FIXING NGO CITY DATA');
    console.log('==============================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const ngos = await User.find({ role: 'recipient' });
    console.log(`📊 Found ${ngos.length} NGOs\n`);

    let fixed = 0;
    let skipped = 0;

    for (const ngo of ngos) {
      const city = extractCityFromName(ngo.name);

      if (!city) {
        console.log(`⚠️  Skipped: ${ngo.name} (city not found in name)`);
        skipped++;
        continue;
      }

      const currentCity = ngo.location?.city;

      if (currentCity === city) {
        skipped++;
        continue;
      }

      const { lat, lng, state } = CITY_COORDINATES[city];

      ngo.location.city = city;
      ngo.location.state = state;
      ngo.location.coordinates = {
        type: 'Point',
        coordinates: [lng, lat]
      };

      await ngo.save();
      fixed++;

      console.log(`✅ Fixed: ${ngo.name}`);
      console.log(`   ${currentCity || 'Unknown'} → ${city}\n`);
    }

    console.log('==============================');
    console.log('📊 FIX SUMMARY');
    console.log('==============================');
    console.log(`Total NGOs: ${ngos.length}`);
    console.log(`Fixed:     ${fixed}`);
    console.log(`Skipped:   ${skipped}`);
    console.log('==============================\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNGOCities();
