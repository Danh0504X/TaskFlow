import UpgradeTransaction from '../models/UpgradeTransaction.js'
import User from '../models/users.js'
import { env } from '../config/environment.js'

/**
 * Tính toán ngày hết hạn gói PRO theo logic cộng dồn (Cumulative Extension)
 * - Nếu đang có PRO chưa hết hạn: Cộng dồn thêm 30 ngày từ ngày hết hạn cũ.
 * - Nếu là FREE hoặc PRO đã hết hạn: Cộng 30 ngày tính từ thời điểm hiện tại.
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

export const paymentService = {
  /**
   * Tạo đơn nâng cấp tài khoản PENDING & Trả về link QR VietQR
   */
  async createPaymentOrder(userId) {
    // Tạo mã thanh toán dạng TF + 6 chữ số ngẫu nhiên (VD: TF849201)
    const randomCode = Math.floor(100000 + Math.random() * 900000)
    const paymentCode = `TF${randomCode}`
    const amount = env.SEPAY_PRO_PRICE

    // Lưu giao dịch PENDING vào DB
    const transaction = await UpgradeTransaction.create({
      userId,
      paymentCode,
      amount,
      status: 'PENDING',
      resolutionStatus: 'AUTO',
    })

    // Xây dựng URL VietQR tự động theo chuẩn VietQR API
    const qrUrl = `https://img.vietqr.io/image/${env.SEPAY_BANK_NAME}-${env.SEPAY_BANK_ACC}-compact2.png?amount=${amount}&addInfo=${paymentCode}&accountName=TaskFlow`

    return {
      transactionId: transaction._id,
      paymentCode,
      amount,
      qrUrl,
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

    const user = await User.findById(userId)

    return {
      paymentCode: transaction.paymentCode,
      status: transaction.status,
      plan: user?.plan || 'FREE',
      currentPlanExpiresAt: user?.currentPlanExpiresAt || null,
    }
  },

  /**
   * Webhook xử lý dữ liệu thanh toán tự động gửi từ SePay
   */
  async handleSePayWebhook(webhookData) {
    const { content, transferAmount } = webhookData

    // Tìm mã giao dịch TFxxxxxx trong nội dung chuyển khoản bằng Regex
    const codeMatch = content ? content.match(/TF\d+/i) : null
    const paymentCode = codeMatch ? codeMatch[0].toUpperCase() : null

    if (!paymentCode) {
      // Trường hợp 2: Sai nội dung chuyển khoản -> Lưu đơn UNMATCHED để Admin duyệt
      await UpgradeTransaction.create({
        userId: null,
        paymentCode: `UNMATCHED_${Date.now()}`,
        amount: Number(transferAmount) || 0,
        status: 'UNMATCHED',
        resolutionStatus: 'MANUAL_PENDING',
        adminNote: `Khách chuyển sai nội dung: "${content}"`,
        sePayData: webhookData,
      })
      return { success: true, message: 'Lưu giao dịch sai nội dung vào Admin Queue' }
    }

    // Tìm đơn hàng PENDING / CANCELLED trong DB
    const transaction = await UpgradeTransaction.findOne({ paymentCode })

    if (!transaction) {
      // Không tìm thấy mã đơn hàng khớp
      await UpgradeTransaction.create({
        userId: null,
        paymentCode,
        amount: Number(transferAmount) || 0,
        status: 'UNMATCHED',
        resolutionStatus: 'MANUAL_PENDING',
        adminNote: `Không tìm thấy mã đơn gốc cho nội dung: "${content}"`,
        sePayData: webhookData,
      })
      return { success: true, message: 'Đã lưu đơn vào Admin Queue do không khớp mã' }
    }

    const receivedAmount = Number(transferAmount) || 0

    // Trường hợp 1: Chuyển THIẾU TIỀN
    if (receivedAmount < transaction.amount) {
      transaction.status = 'PARTIAL_PAID'
      transaction.resolutionStatus = 'MANUAL_PENDING'
      transaction.adminNote = `Chuyển thiếu tiền. Nhận: ${receivedAmount}đ / Cần: ${transaction.amount}đ`
      transaction.sePayData = webhookData
      await transaction.save()

      return { success: true, message: 'Đã cập nhật trạng thái chuyển thiếu tiền' }
    }

    // Trường hợp CHUẨN (hoặc Đơn Hủy/Quá hạn nhưng vẫn chuyển đủ tiền) -> Khôi phục & Nâng PRO
    transaction.status = 'PAID'
    transaction.resolutionStatus = 'AUTO'
    transaction.sePayData = webhookData
    await transaction.save()

    // Nâng cấp User lên PRO
    if (transaction.userId) {
      const user = await User.findById(transaction.userId)
      if (user) {
        user.plan = 'PRO'
        user.currentPlanExpiresAt = calculateProExpirationDate(user.currentPlanExpiresAt, 30)
        await user.save()
      }
    }

    return { success: true, message: 'Nâng cấp tài khoản PRO thành công' }
  },

  /**
   * Admin: Lấy danh sách giao dịch lỗi chờ CSKH / Admin xử lý thủ công
   */
  async getPendingResolutions() {
    return await UpgradeTransaction.find({ resolutionStatus: 'MANUAL_PENDING' })
      .populate('userId', 'fullName email avatarUrl')
      .sort({ createdAt: -1 })
  },

  /**
   * Admin: Duyệt thủ công 1-Click cho giao dịch lỗi
   */
  async resolveTransactionManually({ transactionId, userId, daysToAdd = 30, adminNote, adminId }) {
    const transaction = await UpgradeTransaction.findById(transactionId)
    if (!transaction) {
      throw new Error('Giao dịch không tồn tại')
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng được chọn')
    }

    // Cập nhật giao dịch
    transaction.userId = targetUser._id
    transaction.status = 'PAID'
    transaction.resolutionStatus = 'RESOLVED_BY_ADMIN'
    transaction.resolvedBy = adminId
    transaction.adminNote = adminNote || 'Admin duyệt thủ công'
    transaction.resolvedAt = new Date()
    await transaction.save()

    // Nâng cấp User lên PRO
    targetUser.plan = 'PRO'
    targetUser.currentPlanExpiresAt = calculateProExpirationDate(targetUser.currentPlanExpiresAt, daysToAdd)
    await targetUser.save()

    return {
      transaction,
      user: targetUser,
    }
  },

  /**
   * Admin: Tìm kiếm nhanh User theo Email hoặc Tên để gán đơn lỗi
   */
  async searchUsersForResolution(query) {
    if (!query) return []
    return await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    }).select('fullName email avatarUrl plan currentPlanExpiresAt')
  },
}
