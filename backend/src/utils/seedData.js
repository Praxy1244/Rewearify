// src/utils/seedData.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import { connectDB } from '../config/database.js';

const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify');
    
    // Clear existing data
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Request.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // ===== USERS =====
    const adminUsers = [
      {
        name: 'Admin User',
        email: 'admin@rewearify.com',
        password: await bcryptjs.hash('admin123', 12),
        role: 'admin',
        location: {
          address: 'Admin Building',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
          zipCode: '94105',
          coordinates: { type: 'Point', coordinates: [-122.4194, 37.7749] }
        },
        contact: { phone: '+1234567890' },
        verification: { isEmailVerified: true },
        status: 'active'
      }
    ];

    const donorUsers = [
      {
        name: 'John Smith',
        email: 'john.smith@email.com',
        password: await bcryptjs.hash('password123', 12),
        role: 'donor',
        location: {
          address: '456 Donor Ave',
          city: 'Los Angeles',
          state: 'California',
          country: 'USA',
          zipCode: '90210',
          coordinates: { type: 'Point', coordinates: [-118.2437, 34.0522] }
        },
        contact: { phone: '+1234567891' },
        verification: { isEmailVerified: true },
        status: 'active'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        password: await bcryptjs.hash('password123', 12),
        role: 'donor',
        location: {
          address: '789 Giving Blvd',
          city: 'Chicago',
          state: 'Illinois',
          country: 'USA',
          zipCode: '60601',
          coordinates: { type: 'Point', coordinates: [-87.6298, 41.8781] }
        },
        contact: { phone: '+1234567892' },
        verification: { isEmailVerified: true },
        status: 'active'
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        password: await bcryptjs.hash('password123', 12),
        role: 'donor',
        location: {
          address: '321 Charity Lane',
          city: 'Seattle',
          state: 'Washington',
          country: 'USA',
          zipCode: '98101',
          coordinates: { type: 'Point', coordinates: [-122.3321, 47.6062] }
        },
        contact: { phone: '+1234567893' },
        verification: { isEmailVerified: true },
        status: 'active'
      }
    ];

    const recipientUsers = [
      {
        name: 'Hope Foundation',
        email: 'contact@hopefoundation.org',
        password: await bcryptjs.hash('password123', 12),
        role: 'recipient',
        location: {
          address: '100 Hope Street',
          city: 'Boston',
          state: 'Massachusetts',
          country: 'USA',
          zipCode: '02101',
          coordinates: { type: 'Point', coordinates: [-71.0589, 42.3601] }
        },
        contact: { phone: '+1234567894' },
        organization: {
          name: 'Hope Foundation',
          type: 'NGO',
          registrationNumber: 'NGO001',
          description: 'Supporting homeless individuals...',
          servingAreas: ['Boston', 'Cambridge'],
          targetDemographics: ['homeless', 'low-income families'],
          capacity: 500
        },
        verification: { 
          isEmailVerified: true,
          isOrganizationVerified: true
        },
        status: 'active'
      },
      {
        name: 'Children First Charity',
        email: 'info@childrenfirst.org',
        password: await bcryptjs.hash('password123', 12),
        role: 'recipient',
        location: {
          address: '200 Children Ave',
          city: 'Miami',
          state: 'Florida',
          country: 'USA',
          zipCode: '33101',
          coordinates: { type: 'Point', coordinates: [-80.1918, 25.7617] }
        },
        contact: { phone: '+1234567895' },
        organization: {
          name: 'Children First Charity',
          type: 'Charity',
          registrationNumber: 'CHR002',
          description: 'Providing clothing for underprivileged children',
          servingAreas: ['Miami', 'Fort Lauderdale'],
          targetDemographics: ['children', 'families in need'],
          capacity: 300
        },
        verification: { 
          isEmailVerified: true,
          isOrganizationVerified: true
        },
        status: 'active'
      },
      {
        name: 'Senior Care Alliance',
        email: 'help@seniorcare.org',
        password: await bcryptjs.hash('password123', 12),
        role: 'recipient',
        location: {
          address: '300 Elder Way',
          city: 'Phoenix',
          state: 'Arizona',
          country: 'USA',
          zipCode: '85001',
          coordinates: { type: 'Point', coordinates: [-112.0740, 33.4484] }
        },
        contact: { phone: '+1234567896' },
        organization: {
          name: 'Senior Care Alliance',
          type: 'NGO',
          registrationNumber: 'NGO003',
          description: 'Supporting elderly individuals...',
          servingAreas: ['Phoenix', 'Scottsdale'],
          targetDemographics: ['elderly', 'senior citizens'],
          capacity: 200
        },
        verification: { 
          isEmailVerified: true,
          isOrganizationVerified: true
        },
        status: 'active'
      },
      {
        name: 'Women Empowerment Center',
        email: 'support@womenempowerment.org',
        password: await bcryptjs.hash('password123', 12),
        role: 'recipient',
        location: {
          address: '400 Empowerment Blvd',
          city: 'Denver',
          state: 'Colorado',
          country: 'USA',
          zipCode: '80201',
          coordinates: { type: 'Point', coordinates: [-104.9903, 39.7392] }
        },
        contact: { phone: '+1234567897' },
        organization: {
          name: 'Women Empowerment Center',
          type: 'NGO',
          registrationNumber: 'NGO004',
          description: 'Empowering women through clothing donations...',
          servingAreas: ['Denver', 'Boulder'],
          targetDemographics: ['women', 'single mothers'],
          capacity: 150
        },
        verification: { 
          isEmailVerified: true,
          isOrganizationVerified: true
        },
        status: 'active'
      }
    ];

    const createdAdmins = await User.insertMany(adminUsers);
    const createdDonors = await User.insertMany(donorUsers);
    const createdRecipients = await User.insertMany(recipientUsers);
    
    console.log(`✅ Created ${createdAdmins.length} admin users`);
    console.log(`✅ Created ${createdDonors.length} donor users`);
    console.log(`✅ Created ${createdRecipients.length} recipient organizations`);

    // ===== DONATIONS =====
    const clothingTypes = ['shirt', 'pants', 'dress', 'jacket', 'sweater', 'jeans', 'blouse', 'skirt'];
    const shoeTypes = ['sneakers', 'boots', 'sandals', 'dress shoes', 'casual shoes'];
    const accessoryTypes = ['belt', 'hat', 'scarf', 'bag', 'jewelry'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const conditions = ['excellent', 'good', 'fair'];
    const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'brown', 'navy'];

    const donations = [];
    for (let i = 0; i < 50; i++) {
      const donor = createdDonors[Math.floor(Math.random() * createdDonors.length)];
      const category = ['outerwear', 'casual', 'children', 'accessories', 'shoes'][Math.floor(Math.random() * 5)];
      
      let itemType;
      if (['outerwear', 'casual'].includes(category)) itemType = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
      else if (category === 'shoes') itemType = shoeTypes[Math.floor(Math.random() * shoeTypes.length)];
      else if (category === 'accessories') itemType = accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
      else itemType = 'school uniform'; // for 'children'

      const donation = {
        donor: donor._id,
        title: `${itemType} Donation ${i + 1}`,
        description: `Gently used ${itemType} in good condition`,
        category: category,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        quantity: Math.floor(Math.random() * 5) + 1,
        sizes: [{
          size: category === 'accessories' ? 'One Size' : sizes[Math.floor(Math.random() * sizes.length)],
          quantity: Math.floor(Math.random() * 5) + 1
        }],
        colors: [colors[Math.floor(Math.random() * colors.length)]],
        location: {
          address: donor.location.address,
          city: donor.location.city,
          state: donor.location.state,
          country: donor.location.country,
          zipCode: donor.location.zipCode,
          coordinates: donor.location.coordinates
        },
        status: ['pending', 'approved', 'matched', 'completed'][Math.floor(Math.random() * 4)],
        aiAnalysis: {
          categoryConfidence: 0.9,
          conditionScore: 0.85,
          demandPrediction: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          matchingTags: [category, 'donation']
        }
      };
      
      donations.push(donation);
    }

    const createdDonations = await Donation.insertMany(donations);
    console.log(`✅ Created ${createdDonations.length} donations`);

    // ===== REQUESTS =====
    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    const requests = [];

    for (let i = 0; i < 30; i++) {
      const recipient = createdRecipients[Math.floor(Math.random() * createdRecipients.length)];
      const category = ['outerwear', 'casual', 'children', 'accessories', 'shoes'][Math.floor(Math.random() * 5)];
      
      let itemType;
      if (['outerwear', 'casual'].includes(category)) itemType = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
      else if (category === 'shoes') itemType = shoeTypes[Math.floor(Math.random() * shoeTypes.length)];
      else if (category === 'accessories') itemType = accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
      else itemType = 'school uniform';

      const request = {
        requester: recipient._id,
        title: `Request for ${itemType} ${i + 1}`,
        description: `Need ${itemType} for our beneficiaries`,
        category: category,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        quantity: Math.floor(Math.random() * 20) + 5,
        sizes: [{
          size: sizes[Math.floor(Math.random() * sizes.length)],
          quantity: Math.floor(Math.random() * 5) + 1
        }],
        beneficiaries: {
          count: Math.floor(Math.random() * 100) + 10,
          ageGroup: ['children', 'adults', 'mixed'][Math.floor(Math.random() * 3)],
          gender: 'mixed'
        },
        location: {
          address: recipient.location.address,
          city: recipient.location.city,
          state: recipient.location.state,
          country: recipient.location.country,
          zipCode: recipient.location.zipCode,
          coordinates: recipient.location.coordinates
        },
        timeline: {
          neededBy: new Date(Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
        },
        status: ['active', 'matched', 'fulfilled'][Math.floor(Math.random() * 3)]
      };
      
      requests.push(request);
    }

    const createdRequests = await Request.insertMany(requests);
    console.log(`✅ Created ${createdRequests.length} requests`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Admin users: ${createdAdmins.length}`);
    console.log(`- Donor users: ${createdDonors.length}`);
    console.log(`- Recipient organizations: ${createdRecipients.length}`);
    console.log(`- Donations: ${createdDonations.length}`);
    console.log(`- Requests: ${createdRequests.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@rewearify.com / admin123');
    console.log('Donor: john.smith@email.com / password123');
    console.log('Recipient: contact@hopefoundation.org / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

if (process.argv[1].endsWith('seedData.js')) {
  seedData();
}

export default seedData;