import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ✅ FIX: Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Indian cities with coordinates
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

// NGO names
const ngoNames = [
  'Hope Foundation', 'Seva Trust', 'Care India', 'Helping Hands',
  'Smile Foundation', 'Goonj', 'Akshaya Patra', 'CRY',
  'Pratham', 'Teach For India', 'Magic Bus', 'Udaan',
  'Disha Foundation', 'Sewa Bharti', 'Samarthanam Trust',
  'Asha for Education', 'Deepalaya', 'Nanhi Kali', 'Bal Raksha',
  'Khushi Foundation', 'Udayan Care', 'Salaam Baalak Trust'
];

const donorNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy',
  'Vikram Singh', 'Ananya Iyer', 'Rohan Mehta', 'Kavya Nair',
  'Arjun Desai', 'Meera Kulkarni', 'Sanjay Verma', 'Divya Joshi',
  'Karthik Rao', 'Neha Gupta', 'Aditya Malhotra', 'Pooja Kapoor',
  'Rahul Agarwal', 'Shreya Das', 'Varun Bansal', 'Isha Chatterjee',
  'Nikhil Saxena', 'Riya Thakur', 'Manish Pandey', 'Simran Kaur',
  'Gaurav Mishra', 'Tanvi Jain', 'Abhishek Shah', 'Nidhi Bose'
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Clear existing users (except keep admins if any)
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('🗑️  Cleared existing users');

    const users = [];

    // ==================== CREATE ADMIN ====================
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

    // ==================== CREATE DONORS ====================
    const defaultPassword = await bcrypt.hash('Password@123', 12);
    
    for (let i = 0; i < donorNames.length; i++) {
      const city = cities[i % cities.length];
      const randomOffset = () => (Math.random() - 0.5) * 0.1; // Random coordinate offset
      
      // Different reliability levels
      const totalDonations = Math.floor(Math.random() * 50);
      const isReliable = Math.random() > 0.3; // 70% reliable donors
      
      users.push({
        name: donorNames[i],
        email: `donor${i + 1}@example.com`,
        password: defaultPassword,
        role: 'donor',
        location: {
          address: `${Math.floor(Math.random() * 500) + 1} ${['MG Road', 'Park Street', 'Main Road', 'Colony'][Math.floor(Math.random() * 4)]}`,
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
        profile: {
          bio: `Passionate donor from ${city.name}. Love helping the community!`,
          profilePicture: { url: `https://i.pravatar.cc/150?img=${i + 1}` }
        },
        verification: {
          isEmailVerified: true,
          isPhoneVerified: isReliable,
          isOrganizationVerified: false
        },
        statistics: {
          totalDonations: totalDonations,
          totalRequests: 0
        },
        status: 'active',
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    // ==================== CREATE NGOs/RECIPIENTS ====================
    let ngoIndex = 0;
    for (const city of cities) {
      // Create 5-7 NGOs per city
      const ngosInCity = 5 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < ngosInCity; i++) {
        const ngoName = ngoNames[ngoIndex % ngoNames.length];
        const randomOffset = () => (Math.random() - 0.5) * 0.15;
        
        // Different capacity/activity levels
        const totalRequests = Math.floor(Math.random() * 100);
        const isActive = Math.random() > 0.2; // 80% active NGOs
        
        users.push({
          name: `${ngoName} - ${city.name}`,
          email: `ngo${ngoIndex + 1}@example.com`,
          password: defaultPassword,
          role: 'recipient',
          location: {
            address: `${Math.floor(Math.random() * 200) + 1} ${['Main Road', 'Society Lane', 'Nagar', 'Sector'][Math.floor(Math.random() * 4)]}`,
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
            name: `${ngoName} - ${city.name}`,
            type: ['NGO', 'Charity', 'Community Group'][Math.floor(Math.random() * 3)],
            registrationNumber: `REG${Math.floor(100000 + Math.random() * 900000)}`
          },
          profile: {
            bio: `Serving the ${city.name} community since ${2000 + Math.floor(Math.random() * 20)}. We focus on ${['education', 'healthcare', 'poverty alleviation', 'women empowerment'][Math.floor(Math.random() * 4)]}.`,
            profilePicture: { url: `https://i.pravatar.cc/150?img=${ngoIndex + 50}` }
          },
          verification: {
            isEmailVerified: true,
            isPhoneVerified: true,
            isOrganizationVerified: isActive
          },
          statistics: {
            totalDonations: 0,
            totalRequests: totalRequests
          },
          status: isActive ? 'active' : 'inactive',
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
        
        ngoIndex++;
      }
    }

    // Insert all users
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Created ${insertedUsers.length} users:`);
    console.log(`   - 1 Admin`);
    console.log(`   - ${donorNames.length} Donors`);
    console.log(`   - ${ngoIndex} NGOs`);

    mongoose.connection.close();
    console.log('✅ Seed completed successfully!');
    
    // Return user IDs for next script
    return {
      donors: insertedUsers.filter(u => u.role === 'donor').map(u => u._id),
      ngos: insertedUsers.filter(u => u.role === 'recipient').map(u => u._id)
    };
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().then(() => process.exit(0));
}

export default seedUsers;
