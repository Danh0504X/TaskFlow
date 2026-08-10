import UpgradeTransaction from '../models/UpgradeTransaction.js'
import WebhookLog from '../models/WebhookLog.js'
import AuditLog from '../models/AuditLog.js'
import User from '../models/users.js'
import { env } from '../config/environment.js'
import { emailService } from './email/emailService.js'
import { EMAIL_PURPOSE } from '../utils/constants.js'

/**
 * Che số tài khoản ngân hàng (BR-21)
 * Ví dụ: 0981234567 -> 098****567
 */
const maskAccountNumber = (accNo) => {
  if (!accNo || typeof accNo !== 'string') return ''
  const str = accNo.trim()
  if (str.length <= 5) return '***'
  return `${str.slice(0, 3)}****${str.slice(-3)}`
}

/**
 * Tính toán ngày hết hạn gói PRO theo logic cộng dồn (Cumulative Extension - BR-24)
 * - Nếu đang có PRO chưa hết hạn: Cộng dồn thêm daysToAdd ngày từ ngày hết hạn cũ.
 * - Nếu là FREE hoặc PRO đã hết hạn: Cộng daysToAdd ngày tính từ thời điểm hiện tại.
 * - Nếu daysToAdd là số âm (gỡ PRO thủ công): Trừ bớt ngày hoặc đưa về FREE nếu ngày < now.
 */
const calculateProExpirationDate = (currentExpiresAt, daysToAdd = 30) => {
  const now = new Date()
  let baseDate = now

  if (currentExpiresAt && new Date(currentExpiresAt) > now) {
    baseDate = new Date(currentExpiresAt)
  }

  const expirationDate = new Date(baseDate)
  expirationDate.setDate(expirationDate.getDate() + daysToAdd)
  return expirationDate
}

/**
 * Helper gửi email xác nhận thanh toán (PAY-07)
 * Gửi email thất bại KHÔNG làm hỏng luồng nâng cấp PRO. Ghi log để theo dõi.
 */
const sendPaymentConfirmationEmail = async (user, transaction, newExpiresAt) => {
  if (!user || !user.email) return
  if (transaction.emailSent) return // Mỗi đơn chỉ gửi 1 lần (PAY-07 item 4)

  try {
    const paidAtFormatted = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    const expiresAtFormatted = newExpiresAt
      ? new Date(newExpiresAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : 'Không xác định'

    await emailService.sendEmailByTemplate({
      to: user.email,
      template: EMAIL_PURPOSE.PAYMENT_SUCCESS,
      data: {
        fullName: user.fullName,
        paymentCode: transaction.paymentCode,
        planName: 'Gói PRO (30 Ngày)',
        amount: transaction.amount,
        paidAt: paidAtFormatted,
        expiresAt: expiresAtFormatted,
      },
    })

    transaction.emailSent = true
    await transaction.save()
  } catch (err) {
    console.error('⚠️ [PAYMENT_EMAIL] Gửi email xác nhận thanh toán thất bại:', err.message)
    // Không ném lỗi để tránh rollback việc nâng cấp PRO
  }
}

export const paymentService = {
  /**
   * Tạo hoặc lấy lại đơn nâng cấp tài khoản PENDING (BR-19, BR-23, PAY-03)
   */
  async createPaymentOrder(userId) {
    const now = new Date()
    const user = await User.findById(userId)

    // BR-23: Đã có đơn PENDING chưa hết hạn -> Mở lại đúng đơn đó
    const existingPending = await UpgradeTransaction.findOne({
      userId,
      status: 'PENDING',
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 })

    let transaction = existingPending
    let isExistingOrder = false

    if (transaction) {
      isExistingOrder = true
    } else {
      // Hạn đơn 30 phút (BR-19)
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)
      const randomCode = Math.floor(100000 + Math.random() * 900000)
      const paymentCode = `TF${randomCode}`
      const amount = env.SEPAY_PRO_PRICE

      transaction = await UpgradeTransaction.create({
        userId,
        paymentCode,
        amount,
        status: 'PENDING',
        resolutionStatus: 'AUTO',
        expiresAt,
      })
    }

    const qrUrl = `https://img.vietqr.io/image/${env.SEPAY_BANK_NAME}-${env.SEPAY_BANK_ACC}-compact2.png?amount=${transaction.amount}&addInfo=${transaction.paymentCode}&accountName=TaskFlow`

    // Tính trước ngày hết hạn mới dự kiến nếu nạp thành công (PAY-06)
    const expectedExpiresAt = calculateProExpirationDate(user?.currentPlanExpiresAt, 30)

    return {
      transactionId: transaction._id,
      paymentCode: transaction.paymentCode,
      amount: transaction.amount,
      qrUrl,
      bankName: env.SEPAY_BANK_NAME,
      bankAccount: env.SEPAY_BANK_ACC,
      expiresAt: transaction.expiresAt,
      isExistingOrder,
      expectedExpiresAt,
      currentPlan: user?.plan || 'FREE',
      currentPlanExpiresAt: user?.currentPlanExpiresAt || null,
    }
  },

  /**
   * Lấy đơn PENDING dở dang của user (dùng cho banner nhắc nhở - PAY-03 item 5)
   */
  async getPendingOrder(userId) {
    const now = new Date()
    const transaction = await UpgradeTransaction.findOne({
      userId,
      status: 'PENDING',
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 })

    if (!transaction) return null

    return {
      paymentCode: transaction.paymentCode,
      amount: transaction.amount,
      expiresAt: transaction.expiresAt,
      qrUrl: `https://img.vietqr.io/image/${env.SEPAY_BANK_NAME}-${env.SEPAY_BANK_ACC}-compact2.png?amount=${transaction.amount}&addInfo=${transaction.paymentCode}&accountName=TaskFlow`,
      bankName: env.SEPAY_BANK_NAME,
      bankAccount: env.SEPAY_BANK_ACC,
    }
  },

  /**
   * Kiểm tra trạng thái đơn hàng (Dùng cho Polling Frontend)
   */
  async checkPaymentStatus(paymentCode, userId) {
    const transaction = await UpgradeTransaction.findOne({ paymentCode })
    if (!transaction) {
      throw new Error('Giao dịch không tồn tại')
    }

    // Nếu đơn quá hạn mà vẫn PENDING -> Đổi thành CANCELLED (BR-19)
    if (transaction.status === 'PENDING' && transaction.expiresAt && new Date() > new Date(transaction.expiresAt)) {
      transaction.status = 'CANCELLED'
      await transaction.save()
    }

    const user = await User.findById(userId)

    return {
      paymentCode: transaction.paymentCode,
      status: transaction.status,
      plan: user?.plan || 'FREE',
      currentPlanExpiresAt: user?.currentPlanExpiresAt || null,
      expiresAt: transaction.expiresAt,
    }
  },

  /**
   * Lấy Lịch sử giao dịch của chính người dùng (PAY-05)
   */
  async getUserTransactionHistory(userId) {
    // Chỉ lấy các giao dịch đã hoàn tất/xử lý (PAID, PARTIAL_PAID, CANCELLED, UNMATCHED...) - Bỏ qua các đơn PENDING chưa chuyển khoản
    const transactions = await UpgradeTransaction.find({
      userId,
      status: { $ne: 'PENDING' },
    })
      .sort({ createdAt: -1 })
      .lean()

    const user = await User.findById(userId).lean()

    return {
      currentPlan: user?.plan || 'FREE',
      currentPlanExpiresAt: user?.currentPlanExpiresAt || null,
      history: transactions.map((t) => ({
        id: t._id,
        paymentCode: t.paymentCode,
        amount: t.amount,
        status: t.status,
        resolutionStatus: t.resolutionStatus,
        createdAt: t.createdAt,
        isManual: t.isManual || false,
        referenceCode: t.referenceCode || '',
      })),
    }
  },

  /**
   * Webhook xử lý dữ liệu thanh toán tự động gửi từ SePay (PAY-04, PAY-07, PAY-08)
   */
  async handleSePayWebhook(webhookData, authHeader = '') {
    const { content, transferAmount, referenceCode, accountNumber, accountName } = webhookData

    const maskedAcc = maskAccountNumber(accountNumber)

    // Regex tìm mã TFxxxxxx trong nội dung chuyển khoản
    const codeMatch = content ? content.match(/TF\d+/i) : null
    const paymentCode = codeMatch ? codeMatch[0].toUpperCase() : null

    if (!paymentCode) {
      // Khách gõ sai nội dung -> Lưu WebhookLog & UpgradeTransaction UNMATCHED
      const unmatchTx = await UpgradeTransaction.create({
        userId: null,
        paymentCode: `UNMATCHED_${Date.now()}`,
        amount: Number(transferAmount) || 0,
        status: 'UNMATCHED',
        resolutionStatus: 'MANUAL_PENDING',
        adminNote: `Khách chuyển sai nội dung: "${content}"`,
        sePayData: webhookData,
        referenceCode: referenceCode || '',
      })

      await WebhookLog.create({
        resultStatus: 'UNMATCHED',
        amount: Number(transferAmount) || 0,
        contentRaw: content || '',
        bankReferenceCode: referenceCode || '',
        maskedAccountNumber: maskedAcc,
        accountName: accountName || '',
        matchedTransactionId: unmatchTx._id,
        payload: webhookData,
        note: 'Chuyển sai nội dung thanh toán',
      })

      return { success: true, message: 'Đã ghi nhận giao dịch không khớp mã đơn' }
    }

    // Tìm đơn hàng trong DB
    const transaction = await UpgradeTransaction.findOne({ paymentCode })

    if (!transaction) {
      const unmatchTx = await UpgradeTransaction.create({
        userId: null,
        paymentCode,
        amount: Number(transferAmount) || 0,
        status: 'UNMATCHED',
        resolutionStatus: 'MANUAL_PENDING',
        adminNote: `Không tìm thấy mã đơn gốc cho nội dung: "${content}"`,
        sePayData: webhookData,
        referenceCode: referenceCode || '',
      })

      await WebhookLog.create({
        resultStatus: 'UNMATCHED',
        amount: Number(transferAmount) || 0,
        contentRaw: content || '',
        bankReferenceCode: referenceCode || '',
        maskedAccountNumber: maskedAcc,
        accountName: accountName || '',
        matchedTransactionId: unmatchTx._id,
        payload: webhookData,
        note: 'Mã đơn không tồn tại trong hệ thống',
      })

      return { success: true, message: 'Lưu vào danh sách chờ xử lý thủ công do không có đơn gốc' }
    }

    const receivedAmount = Number(transferAmount) || 0

    // Trường hợp 1: Chuyển THIẾU TIỀN
    if (receivedAmount < transaction.amount) {
      transaction.status = 'PARTIAL_PAID'
      transaction.resolutionStatus = 'MANUAL_PENDING'
      transaction.adminNote = `Chuyển thiếu tiền. Nhận: ${receivedAmount}đ / Cần: ${transaction.amount}đ`
      transaction.sePayData = webhookData
      transaction.referenceCode = referenceCode || transaction.referenceCode
      await transaction.save()

      await WebhookLog.create({
        resultStatus: 'UNMATCHED',
        amount: receivedAmount,
        contentRaw: content || '',
        bankReferenceCode: referenceCode || '',
        maskedAccountNumber: maskedAcc,
        accountName: accountName || '',
        matchedTransactionId: transaction._id,
        payload: webhookData,
        note: `Chuyển thiếu tiền: nhận ${receivedAmount} / cần ${transaction.amount}`,
      })

      return { success: true, message: 'Đã cập nhật trạng thái chuyển thiếu tiền' }
    }

    // Trường hợp CHUẨN: Chuyển đủ tiền -> Cập nhật PAID & Nâng PRO
    transaction.status = 'PAID'
    transaction.resolutionStatus = 'AUTO'
    transaction.sePayData = webhookData
    transaction.referenceCode = referenceCode || transaction.referenceCode
    await transaction.save()

    let updatedUser = null
    if (transaction.userId) {
      const user = await User.findById(transaction.userId)
      if (user) {
        const newExpiresAt = calculateProExpirationDate(user.currentPlanExpiresAt, 30)
        user.plan = 'PRO'
        user.currentPlanExpiresAt = newExpiresAt
        await user.save()
        updatedUser = user

        // PAY-07: Gửi email xác nhận tự động
        await sendPaymentConfirmationEmail(user, transaction, newExpiresAt)
      }
    }

    await WebhookLog.create({
      resultStatus: 'MATCHED',
      amount: receivedAmount,
      contentRaw: content || '',
      bankReferenceCode: referenceCode || '',
      maskedAccountNumber: maskedAcc,
      accountName: accountName || '',
      matchedTransactionId: transaction._id,
      payload: webhookData,
      note: 'Khớp đơn và nâng cấp PRO thành công',
    })

    return { success: true, message: 'Nâng cấp tài khoản PRO thành công' }
  },

  /**
   * Admin: Lấy danh sách Webhook Logs (PAY-08)
   */
  async getWebhookLogs({ resultStatus, limit = 50 }) {
    const query = {}
    if (resultStatus) {
      query.resultStatus = resultStatus
    }

    const logs = await WebhookLog.find(query)
      .populate({
        path: 'matchedTransactionId',
        populate: { path: 'userId', select: 'fullName email avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    const unmatchedCount = await WebhookLog.countDocuments({ resultStatus: 'UNMATCHED' })

    return {
      logs,
      unmatchedCount,
    }
  },

  /**
   * Admin: Lấy danh sách giao dịch lỗi chờ CSKH / Admin xử lý thủ công (PAY-08, PAY-09)
   */
  async getPendingResolutions() {
    const transactions = await UpgradeTransaction.find({ resolutionStatus: 'MANUAL_PENDING' })
      .populate('userId', 'fullName email avatarUrl')
      .sort({ createdAt: -1 })
      .lean()

    const unhandledCount = transactions.length
    return { transactions, unhandledCount }
  },

  /**
   * Admin: Cấp hoặc gỡ gói PRO thủ công cho tài khoản (PAY-09)
   */
  async manualGrantOrRevokePro({ userId, daysToAdd = 30, adminNote, referenceCode, adminId, transactionId }) {
    if (!adminNote || !adminNote.trim()) {
      throw new Error('Bắt buộc phải nhập lý do khi xử lý thủ công (PAY-09)')
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng được chọn')
    }

    let transaction = null
    if (transactionId) {
      transaction = await UpgradeTransaction.findById(transactionId)
    }

    if (!transaction) {
      // Tạo giao dịch thủ công mới
      const randomCode = Math.floor(100000 + Math.random() * 900000)
      transaction = new UpgradeTransaction({
        userId: targetUser._id,
        paymentCode: `MANUAL_${randomCode}`,
        amount: daysToAdd >= 0 ? env.SEPAY_PRO_PRICE : 0,
        status: 'PAID',
        resolutionStatus: 'RESOLVED_BY_ADMIN',
        resolvedBy: adminId,
        adminNote: adminNote.trim(),
        referenceCode: referenceCode || '',
        isManual: true,
        resolvedAt: new Date(),
      })
    } else {
      transaction.userId = targetUser._id
      transaction.status = 'PAID'
      transaction.resolutionStatus = 'RESOLVED_BY_ADMIN'
      transaction.resolvedBy = adminId
      transaction.adminNote = adminNote.trim()
      transaction.referenceCode = referenceCode || transaction.referenceCode
      transaction.isManual = true
      transaction.resolvedAt = new Date()
    }

    await transaction.save()

    // Cập nhật PRO cho User theo số ngày
    const newDays = Number(daysToAdd)

    if (newDays <= -999) {
      // Gỡ PRO hoàn toàn ngay lập tức
      targetUser.plan = 'FREE'
      targetUser.currentPlanExpiresAt = null
    } else if (newDays < 0) {
      // Luồng trừ ngày PRO
      let newExpiresAt = calculateProExpirationDate(targetUser.currentPlanExpiresAt, newDays)
      if (newExpiresAt <= new Date()) {
        targetUser.plan = 'FREE'
        targetUser.currentPlanExpiresAt = null
      } else {
        targetUser.plan = 'PRO'
        targetUser.currentPlanExpiresAt = newExpiresAt
      }
    } else {
      // Luồng cộng thêm ngày PRO
      let newExpiresAt = calculateProExpirationDate(targetUser.currentPlanExpiresAt, newDays)
      targetUser.plan = 'PRO'
      targetUser.currentPlanExpiresAt = newExpiresAt
    }

    await targetUser.save()

    // Ghi nhận nhật ký hệ thống (Audit Log) trực tiếp vào MongoDB
    try {
      let adminInfo = { name: 'System Admin', email: 'admin@gmail.com' }
      if (adminId) {
        const adminUser = await User.findById(adminId)
        if (adminUser) {
          adminInfo = { name: adminUser.fullName, email: adminUser.email }
        }
      }
      await AuditLog.create({
        adminName: adminInfo.name,
        adminEmail: adminInfo.email,
        action: newDays >= 0 ? 'USER_PRO_GRANT' : 'USER_PRO_REVOKE',
        targetLabel: targetUser.email,
        detail: newDays >= 0
          ? `Cấp +${newDays} ngày PRO (Lý do: ${adminNote.trim()})`
          : `Gỡ gói PRO (${newDays} ngày) (Lý do: ${adminNote.trim()})`,
      })
    } catch (auditErr) {
      console.error('⚠️ [AUDIT_LOG] Lỗi ghi nhật ký hệ thống:', auditErr.message)
    }

    // Gửi email thông báo cho khách nếu cấp PRO (PAY-09 item 5)
    if (newDays > 0) {
      await sendPaymentConfirmationEmail(targetUser, transaction, targetUser.currentPlanExpiresAt)
    }

    return {
      transaction,
      user: targetUser,
    }
  },

  /**
   * Admin: Tìm kiếm nhanh User theo Email hoặc Tên để gán đơn lỗi
   */
  async searchUsersForResolution(query) {
    if (!query || !query.trim()) return []
    return await User.find({
      $or: [
        { email: { $regex: query.trim(), $options: 'i' } },
        { fullName: { $regex: query.trim(), $options: 'i' } },
      ],
    }).select('fullName email avatarUrl plan currentPlanExpiresAt')
  },
}
