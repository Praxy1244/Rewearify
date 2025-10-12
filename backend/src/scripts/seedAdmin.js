import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    
    // Clear existing data
    await User.deleteMany({});
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rewearify.com',
      password: adminPassword,
      role: 'admin',
      verification: { isEmailVerified: true },
      status: 'active'
    });
    
    console.log('✅ Database seeded successfully');
    console.log('Admin credentials: admin@rewearify.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
