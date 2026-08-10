import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';
import User from '../models/users.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const findTxs = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const allTxs = await UpgradeTransaction.find().populate('userId', 'email fullName');
    console.log(`Total transactions in DB: ${allTxs.length}`);
    allTxs.forEach((t) => {
      console.log(`- Code: ${t.paymentCode}, Amount: ${t.amount}, Status: ${t.status}, CreatedAt: ${t.createdAt}, User: ${t.userId?.email || 'N/A'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findTxs();
