import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import User from '../models/users.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const grantPro = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const targetEmail = 'doancongkhoa2005@gmail.com';
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log(`❌ User "${targetEmail}" not found.`);
      process.exit(1);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    user.plan = 'PRO';
    user.currentPlanExpiresAt = expiresAt;
    await user.save();

    // Tạo 1 bản ghi giao dịch PAID mẫu để hiển thị trong Lịch sử thanh toán
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    await UpgradeTransaction.create({
      userId: user._id,
      paymentCode: `TF${randomCode}`,
      amount: 2000,
      status: 'PAID',
      resolutionStatus: 'AUTO',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    console.log(`✅ Success! Upgraded "${targetEmail}" to PRO plan until ${expiresAt.toLocaleString('vi-VN')}. Created test transaction TF${randomCode}.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

grantPro();
