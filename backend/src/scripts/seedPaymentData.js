import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'
import User from '../models/users.js'
import UpgradeTransaction from '../models/UpgradeTransaction.js'
import WebhookLog from '../models/WebhookLog.js'
import AuditLog from '../models/AuditLog.js'

// Fix Windows ISP DNS SRV lookup issue
try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch (e) {
  // ignore
}

dotenv.config()

const seedPaymentData = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING
    if (!mongoUri) {
      console.error('❌ MONGODB_CONNECTION_STRING is missing in .env')
      process.exit(1)
    }

    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB successfully!')

    // Lấy hoặc tạo sẵn vài user mẫu để gán giao dịch lỗi demo
    let users = await User.find({ role: 'user' }).limit(5)

    if (users.length === 0) {
      console.log('⚠️ Không tìm thấy user mẫu. Tạo 3 user thử nghiệm...')
      const u1 = await User.create({
        fullName: 'Nguyễn Văn An',
        email: 'an.nguyen.demo@gmail.com',
        passwordHash: 'dummy_hash',
        isEmailVerified: true,
        status: 'active',
        plan: 'FREE',
      })
      const u2 = await User.create({
        fullName: 'Trần Thị Bình',
        email: 'binh.tran.demo@gmail.com',
        passwordHash: 'dummy_hash',
        isEmailVerified: true,
        status: 'active',
        plan: 'FREE',
      })
      const u3 = await User.create({
        fullName: 'Lê Hoàng Cường',
        email: 'cuong.le.demo@gmail.com',
        passwordHash: 'dummy_hash',
        isEmailVerified: true,
        status: 'active',
        plan: 'PRO',
        currentPlanExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      })
      users = [u1, u2, u3]
    }

    const user1 = users[0]
    const user2 = users[1] || users[0]
    const user3 = users[2] || users[0]

    console.log('🧹 Xóa dữ liệu thanh toán, webhook logs & audit logs cũ trước khi seed...')
    await UpgradeTransaction.deleteMany({ paymentCode: { $regex: /(DEMO|TF_DEMO|UNMATCHED_DEMO|MANUAL_DEMO)/ } })
    await WebhookLog.deleteMany({ note: { $regex: /\[DEMO\]/ } })
    await AuditLog.deleteMany({ detail: { $regex: /\[DEMO\]/ } })

    const now = new Date()

    console.log('🌱 Đang khởi tạo dữ liệu giao dịch lỗi, SePay Webhook logs & Audit logs mẫu...')

    // Seed Audit Logs mẫu
    await AuditLog.create([
      {
        adminName: 'System Admin',
        adminEmail: 'admin@gmail.com',
        action: 'USER_PRO_GRANT',
        targetLabel: user1.email,
        detail: '[DEMO] Cấp +30 ngày PRO (Lý do: Admin đối soát thủ công chuyển khoản khớp ngân hàng)',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        adminName: 'System Admin',
        adminEmail: 'admin@gmail.com',
        action: 'USER_PRO_REVOKE',
        targetLabel: user2.email,
        detail: '[DEMO] Gỡ gói PRO (Lý do: Yêu cầu hoàn tiền dịch vụ theo chính sách 7 ngày)',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        adminName: 'System Admin',
        adminEmail: 'admin@gmail.com',
        action: 'USER_LOCK',
        targetLabel: 'spam.account@gmail.com',
        detail: '[DEMO] Khoá tài khoản do vi phạm tiêu chuẩn cộng đồng',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ])

    // 1. Kịch bản Lỗi 1: Chuyển sai nội dung (Mã TF không tồn tại hoặc gõ nhầm) -> UNMATCHED
    const tx1 = await UpgradeTransaction.create({
      userId: null,
      paymentCode: 'UNMATCHED_DEMO_01',
      amount: 2000,
      status: 'UNMATCHED',
      resolutionStatus: 'MANUAL_PENDING',
      adminNote: 'Khách hàng chuyển khoản với nội dung: "Chuyen tien gia han pro account"',
      referenceCode: 'FT2408110001',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 giờ trước
      sePayData: {
        content: 'Chuyen tien gia han pro account',
        transferAmount: 2000,
        referenceCode: 'FT2408110001',
        accountNumber: '0981234567',
        accountName: 'NGUYEN VAN AN',
      },
    })

    await WebhookLog.create({
      resultStatus: 'UNMATCHED',
      amount: 2000,
      contentRaw: 'Chuyen tien gia han pro account',
      bankReferenceCode: 'FT2408110001',
      maskedAccountNumber: '098****567',
      accountName: 'NGUYEN VAN AN',
      matchedTransactionId: tx1._id,
      payload: tx1.sePayData,
      note: '[DEMO] Chuyển sai nội dung thanh toán (Không tìm thấy mã TF)',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    })

    // 2. Kịch bản Lỗi 2: Chuyển thiếu tiền (Cần 2.000đ nhưng chỉ chuyển 1.000đ) -> PARTIAL_PAID
    const tx2 = await UpgradeTransaction.create({
      userId: user1._id,
      paymentCode: 'TF_DEMO_2002',
      amount: 2000,
      status: 'PARTIAL_PAID',
      resolutionStatus: 'MANUAL_PENDING',
      adminNote: 'Chuyển thiếu tiền. Nhận: 1.000đ / Cần: 2.000đ',
      referenceCode: 'FT2408110002',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 giờ trước
      sePayData: {
        content: 'TF_DEMO_2002',
        transferAmount: 1000,
        referenceCode: 'FT2408110002',
        accountNumber: '0912345678',
        accountName: user1.fullName,
      },
    })

    await WebhookLog.create({
      resultStatus: 'UNMATCHED',
      amount: 1000,
      contentRaw: 'TF_DEMO_2002',
      bankReferenceCode: 'FT2408110002',
      maskedAccountNumber: '091****678',
      accountName: user1.fullName,
      matchedTransactionId: tx2._id,
      payload: tx2.sePayData,
      note: '[DEMO] Chuyển thiếu tiền: nhận 1000đ / cần 2000đ',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    })

    // 3. Kịch bản Lỗi 3: Đơn bị quá hạn 30 phút trước khi tiền về -> CANCELLED / EXPIRED
    const tx3 = await UpgradeTransaction.create({
      userId: user2._id,
      paymentCode: 'TF_DEMO_3003',
      amount: 2000,
      status: 'CANCELLED',
      resolutionStatus: 'MANUAL_PENDING',
      adminNote: 'Đơn hàng đã hết hạn (30 phút) trước khi nhận được tiền từ SePay',
      referenceCode: 'FT2408110003',
      expiresAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Đã hết hạn cách đây 1 giờ
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      sePayData: {
        content: 'TF_DEMO_3003',
        transferAmount: 2000,
        referenceCode: 'FT2408110003',
        accountNumber: '0933334444',
        accountName: user2.fullName,
      },
    })

    await WebhookLog.create({
      resultStatus: 'UNMATCHED',
      amount: 2000,
      contentRaw: 'TF_DEMO_3003 thanh toan goi pro',
      bankReferenceCode: 'FT2408110003',
      maskedAccountNumber: '093****444',
      accountName: user2.fullName,
      matchedTransactionId: tx3._id,
      payload: tx3.sePayData,
      note: '[DEMO] Giao dịch gửi đến sau khi đơn hàng đã quá hạn 30 phút',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    })

    // 4. Kịch bản Khớp đơn tự động thành công -> MATCHED & PAID
    const tx4 = await UpgradeTransaction.create({
      userId: user3._id,
      paymentCode: 'TF_DEMO_4004',
      amount: 2000,
      status: 'PAID',
      resolutionStatus: 'AUTO',
      referenceCode: 'FT2408110004',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      sePayData: {
        content: 'TF_DEMO_4004',
        transferAmount: 2000,
        referenceCode: 'FT2408110004',
        accountNumber: '0977778888',
        accountName: user3.fullName,
      },
    })

    await WebhookLog.create({
      resultStatus: 'MATCHED',
      amount: 2000,
      contentRaw: 'TF_DEMO_4004',
      bankReferenceCode: 'FT2408110004',
      maskedAccountNumber: '097****888',
      accountName: user3.fullName,
      matchedTransactionId: tx4._id,
      payload: tx4.sePayData,
      note: '[DEMO] Khớp đơn chuẩn và tự động nâng cấp PRO 30 ngày',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    })

    // 5. Kịch bản Admin cấp PRO thủ công -> RESOLVED_BY_ADMIN
    const tx5 = await UpgradeTransaction.create({
      userId: user1._id,
      paymentCode: 'MANUAL_DEMO_5005',
      amount: 2000,
      status: 'PAID',
      resolutionStatus: 'RESOLVED_BY_ADMIN',
      isManual: true,
      adminNote: 'Admin đối soát ngân hàng khớp mã FT2408110005, duyệt cấp PRO 30 ngày thủ công.',
      referenceCode: 'FT2408110005',
      resolvedAt: new Date(now.getTime() - 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    })

    console.log('✅ Đã tạo thành công các dữ liệu mẫu giao dịch lỗi & SePay logs:')
    console.log('  1. Giao dịch chuyển sai nội dung (UNMATCHED)')
    console.log('  2. Giao dịch chuyển thiếu tiền (PARTIAL_PAID)')
    console.log('  3. Giao dịch cho đơn hết hạn (CANCELLED)')
    console.log('  4. Giao dịch chuẩn tự động (MATCHED / PAID)')
    console.log('  5. Giao dịch Admin xử lý thủ công (RESOLVED_BY_ADMIN)')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Lỗi khi seed dữ liệu thanh toán:', err)
    process.exit(1)
  }
}

seedPaymentData()
