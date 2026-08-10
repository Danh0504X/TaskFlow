import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dns from 'dns';
import { env } from '../config/environment.js';
import User from '../models/users.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const resetPassword = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const targetEmail = 'doancongkhoa2005@gmail.com';
    const newPassword = '123456';

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.log(`❌ User with email "${targetEmail}" not found in database.`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.isEmailVerified = true;
    user.authProvider = 'local';
    user.status = 'active';
    await user.save();

    console.log(`✅ Success! Updated password for "${targetEmail}" to "${newPassword}".`);
    console.log(`User Details: Name: ${user.fullName}, Role: ${user.role}, Plan: ${user.plan}, Verified: ${user.isEmailVerified}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();
