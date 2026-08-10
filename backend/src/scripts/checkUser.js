import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import User from '../models/users.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const checkUser = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const targetEmail = 'doancongkhoa2005@gmail.com';
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log(`❌ User "${targetEmail}" not found.`);
      process.exit(1);
    }

    console.log('=== USER DATA ===');
    console.log(`ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Plan: ${user.plan}`);
    console.log(`ExpiresAt: ${user.currentPlanExpiresAt}`);

    const txs = await UpgradeTransaction.find({ userId: user._id });
    console.log(`=== TRANSACTIONS (${txs.length}) ===`);
    txs.forEach(t => {
      console.log(`- Code: ${t.paymentCode}, Amount: ${t.amount}, Status: ${t.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUser();
