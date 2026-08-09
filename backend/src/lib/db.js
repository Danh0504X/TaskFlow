import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from '../config/environment.js';

// Khắc phục sự cố c-ares DNS resolution trên Node.js Windows khi query SRV MongoDB Atlas
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    // Ignore if not supported
}

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_CONNECTION_STRING);
        console.log('😊 Connect to MongooseDB successful.');
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

