import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const resetAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const plainPassword = 'Admin@123';
    const hash = await bcrypt.hash(plainPassword, 12);
    
    // Reset ALL seeded users
    const result = await User.updateMany(
      { 
        email: { 
          $in: [
            'admin@rewearify.com',
            // Donors
            /^donor\d+@gmail\.com$/,
            // NGOs  
            /^ngo\d+@rewearify\.org$/
          ]
        }
      },
      {
        $set: {
          password: hash,
          'security.loginAttempts': 0,
          'security.lockUntil': null,
          'verification.isEmailVerified': true,
          'status': 'active'
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} demo accounts`);

    // Test admin
    const admin = await User.findOne({ email: 'admin@rewearify.com' }).select('+password');
    console.log('✅ Admin password matches:', await bcrypt.compare('Admin@123', admin.password));

    // Test donor1
    const donor1 = await User.findOne({ email: 'donor1@gmail.com' }).select('+password');
    if (donor1) {
      console.log('✅ donor1@gmail.com password matches:', await bcrypt.compare('Admin@123', donor1.password));
    }

    // Test ngo1
    const ngo1 = await User.findOne({ email: 'ngo1@rewearify.org' }).select('+password');
    if (ngo1) {
      console.log('✅ ngo1@rewearify.org password matches:', await bcrypt.compare('Admin@123', ngo1.password));
    }

    console.log('\n🎯 ALL ACCOUNTS READY:');
    console.log('📧 admin@rewearify.com');
    console.log('📧 donor1@gmail.com → donor15@gmail.com');
    console.log('📧 ngo1@rewearify.org → ngo15@rewearify.org');
    console.log('🔑 Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAll();
