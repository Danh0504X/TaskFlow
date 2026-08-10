import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import User from '../models/users.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const listUsers = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    const users = await User.find().select('fullName email role plan currentPlanExpiresAt createdAt');
    console.log(`Total users in DB: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.fullName}, Email: ${u.email}, Plan: ${u.plan}, CreatedAt: ${u.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();
