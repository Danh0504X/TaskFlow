import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';

// Đặt DNS custom (Google & Cloudflare) để tránh lỗi querySrv ECONNREFUSED do DNS của ISP Việt Nam
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_CONNECTION_STRING);
        console.log('😊 Connect to MongooseDB successful.');
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

