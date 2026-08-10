import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import User from '../models/users.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const downgradeUser = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const targetEmail = 'doancongkhoa2008@gmail.com';
    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.log(`❌ User "${targetEmail}" not found.`);
      process.exit(1);
    }

    user.plan = 'FREE';
    user.currentPlanExpiresAt = null;
    await user.save();

    console.log(`✅ Success! Downgraded "${targetEmail}" from PRO to FREE.`);
    console.log(`User Info: Name: ${user.fullName}, Email: ${user.email}, Plan: ${user.plan}, ExpiresAt: ${user.currentPlanExpiresAt}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error downgrading user:', err);
    process.exit(1);
  }
};

downgradeUser();
