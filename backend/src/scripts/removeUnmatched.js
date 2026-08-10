import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import WebhookLog from '../models/WebhookLog.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const removeUnmatched = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    // 1. Xóa tất cả các bản ghi WebhookLog có resultStatus = 'UNMATCHED'
    const resLogs = await WebhookLog.deleteMany({ resultStatus: 'UNMATCHED' });
    console.log(`🧹 Đã xóa ${resLogs.deletedCount} nhật ký Webhook UNMATCHED.`);

    // 2. Xóa tất cả các bản ghi UpgradeTransaction có status = 'UNMATCHED' hoặc resolutionStatus = 'MANUAL_PENDING'
    const resTxs = await UpgradeTransaction.deleteMany({
      $or: [
        { status: 'UNMATCHED' },
        { resolutionStatus: 'MANUAL_PENDING' }
      ]
    });
    console.log(`🧹 Đã xóa ${resTxs.deletedCount} giao dịch UNMATCHED trong UpgradeTransaction.`);

    // In danh sách Webhook Logs còn lại
    const remainingLogs = await WebhookLog.find();
    console.log(`\n✅ DANH SÁCH NHẬT KÝ WEBHOOK CÒN LẠI (${remainingLogs.length}):`);
    remainingLogs.forEach(l => {
      console.log(`- Trạng thái: ${l.resultStatus} | Số tiền: ${l.amount}đ | Nội dung: "${l.contentRaw}" | Note: ${l.note}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error removing unmatched:', err);
    process.exit(1);
  }
};

removeUnmatched();
