import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const plainPassword = 'Admin@123';
    const hash = await bcrypt.hash(plainPassword, 12);
    console.log('🔑 New hash created');

    const result = await User.updateOne(
      { email: 'admin@rewearify.com' },
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

    console.log('✅ Admin updated:', result.modifiedCount);
    
    const user = await User.findOne({ email: 'admin@rewearify.com' }).select('+password');
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    console.log('✅ Password matches:', isMatch);

    console.log('\n🎯 LOGIN WITH:');
    console.log('📧 admin@rewearify.com');
    console.log('🔑 Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

reset();
