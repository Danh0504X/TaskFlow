import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import WebhookLog from '../models/WebhookLog.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const seedWebhookLogs = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    // Xóa bớt log cũ nếu có
    await WebhookLog.deleteMany({});

    // Tìm giao dịch TF147688 của doancongkhoa2005@gmail.com
    const tx147688 = await UpgradeTransaction.findOne({ paymentCode: 'TF147688' });

    const logs = [
      {
        resultStatus: 'MATCHED',
        amount: 2000,
        contentRaw: 'TF147688 Khoa Doan nang cap PRO',
        bankReferenceCode: 'FT2622391029381',
        maskedAccountNumber: '090****367',
        accountName: 'KHOA DOAN',
        matchedTransactionId: tx147688 ? tx147688._id : null,
        payload: {
          gateway: 'MBBank',
          transactionDate: '2026-08-10 09:36:53',
          accountNumber: '0906555367',
          subAccount: null,
          transferAmount: 2000,
          content: 'TF147688 Khoa Doan nang cap PRO',
          referenceCode: 'FT2622391029381',
          accumulated: 2000
        },
        note: 'Khớp đơn và nâng cấp PRO thành công'
      },
      {
        resultStatus: 'UNMATCHED',
        amount: 50000,
        contentRaw: 'Khoa nhat va chuyen tien mua goi AI',
        bankReferenceCode: 'FT2622391099882',
        maskedAccountNumber: '098****123',
        accountName: 'NGUYEN VAN A',
        matchedTransactionId: null,
        payload: {
          gateway: 'MBBank',
          transactionDate: '2026-08-10 08:15:20',
          accountNumber: '0981234567',
          transferAmount: 50000,
          content: 'Khoa nhat va chuyen tien mua goi AI',
          referenceCode: 'FT2622391099882'
        },
        note: 'Chuyển sai nội dung thanh toán (Không tìm thấy mã TFxxxxxx)'
      }
    ];

    await WebhookLog.insertMany(logs);
    console.log(`✅ Đã khởi tạo lại ${logs.length} nhật ký Webhook SePay thành công!`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding webhook logs:', err);
    process.exit(1);
  }
};

seedWebhookLogs();
