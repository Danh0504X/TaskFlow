import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/environment.js';
import UpgradeTransaction from '../models/UpgradeTransaction.js';
import WebhookLog from '../models/WebhookLog.js';
import User from '../models/users.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const cleanMockData = async () => {
  try {
    await mongoose.connect(env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas.');

    // 1. Xóa tất cả các đơn hàng CHƯA THANH TOÁN (status khác PAID)
    const deletePendingResult = await UpgradeTransaction.deleteMany({ status: { $ne: 'PAID' } });
    console.log(`🧹 Đã xóa ${deletePendingResult.deletedCount} đơn hàng chưa thanh toán (PENDING, UNMATCHED, PARTIAL_PAID, CANCELLED).`);

    // 2. Xóa các tài khoản test mock (email chứa @example.com hoặc @taskflow.com) ngoại trừ tài khoản chính
    const deleteTestUsersResult = await User.deleteMany({
      email: { $regex: /@example\.com|@taskflow\.com/, $options: 'i' },
    });
    console.log(`🧹 Đã xóa ${deleteTestUsersResult.deletedCount} tài khoản test mock.`);

    // 3. Xóa các đơn hàng PAID liên quan tới các user test đã xóa
    const validUserIds = (await User.find().select('_id')).map(u => u._id);
    const deleteOrphanedTx = await UpgradeTransaction.deleteMany({
      userId: { $nin: validUserIds, $ne: null }
    });
    console.log(`🧹 Đã dọn dẹp ${deleteOrphanedTx.deletedCount} giao dịch rác không thuộc user hợp lệ.`);

    // 4. Xóa Webhook logs rác
    const deleteWebhookLogs = await WebhookLog.deleteMany({});
    console.log(`🧹 Đã dọn dẹp ${deleteWebhookLogs.deletedCount} bản ghi Webhook log thử nghiệm.`);

    // Danh sách user còn lại trong DB
    const remainingUsers = await User.find().select('fullName email plan role');
    console.log('\n✅ DANH SÁCH TÀI KHOẢN HỢP LỆ CÒN LẠI TRONG DATABASE:');
    remainingUsers.forEach(u => {
      console.log(`- ${u.fullName} (${u.email}) | Plan: ${u.plan} | Role: ${u.role}`);
    });

    const remainingTxs = await UpgradeTransaction.find().populate('userId', 'email');
    console.log(`\n✅ DANH SÁCH GIAO DỊCH CÒN LẠI IN DATABASE (${remainingTxs.length}):`);
    remainingTxs.forEach(t => {
      console.log(`- Mã: ${t.paymentCode} | Số tiền: ${t.amount}đ | Trạng thái: ${t.status} | User: ${t.userId?.email}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning mock data:', err);
    process.exit(1);
  }
};

cleanMockData();
