import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import Notification from '../models/Notification.js';
import Match from '../models/Match.js';
import ResetToken from '../models/ResetToken.js';

dotenv.config();

const cleanDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Starting database cleanup...\n');

    // Delete all collections in the correct order
    const collections = [
      { model: Notification, name: 'Notifications' },
      { model: Match, name: 'Matches' },
      { model: ResetToken, name: 'Reset Tokens' },
      { model: Request, name: 'Requests' },
      { model: Donation, name: 'Donations' },
      { model: User, name: 'Users' }
    ];

    for (const { model, name } of collections) {
      const count = await model.countDocuments();
      await model.deleteMany({});
      console.log(`✅ Deleted ${count} ${name}`);
    }

    console.log('\n✨ Database cleaned successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();
