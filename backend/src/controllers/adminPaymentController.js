import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { paymentService } from '../services/paymentService.js'

// Lấy danh sách giao dịch lỗi chờ xử lý thủ công (PAY-08, PAY-09)
export const getPendingResolutions = asyncHandler(async (req, res) => {
  const result = await paymentService.getPendingResolutions()

  res.status(StatusCodes.OK).json({
    message: 'Lấy danh sách giao dịch chờ xử lý thành công',
    data: result,
  })
})

// Duyệt thủ công 1-Click hoặc Cấp/Gỡ gói PRO thủ công (PAY-09)
export const resolveTransactionManually = asyncHandler(async (req, res) => {
  const { transactionId } = req.params
  const { userId, daysToAdd, adminNote, referenceCode } = req.body
  const adminId = req.user._id

  const result = await paymentService.manualGrantOrRevokePro({
    transactionId: transactionId === 'manual' ? null : transactionId,
    userId,
    daysToAdd: daysToAdd !== undefined && daysToAdd !== null && daysToAdd !== '' ? Number(daysToAdd) : 30,
    adminNote,
    referenceCode,
    adminId,
  })

  res.status(StatusCodes.OK).json({
    message: 'Xử lý thủ công thành công',
    data: result,
  })
})

// Lấy Nhật ký Webhook SePay (PAY-08)
export const getWebhookLogs = asyncHandler(async (req, res) => {
  const { resultStatus, limit } = req.query
  const result = await paymentService.getWebhookLogs({ resultStatus, limit })

  res.status(StatusCodes.OK).json({
    message: 'Lấy nhật ký webhook thành công',
    data: result,
  })
})

// Tìm kiếm người dùng theo email/tên để gán đơn lỗi
export const searchUsersForResolution = asyncHandler(async (req, res) => {
  const { q } = req.query
  const result = await paymentService.searchUsersForResolution(q)

  res.status(StatusCodes.OK).json({
    message: 'Tìm kiếm người dùng thành công',
    data: result,
  })
})
