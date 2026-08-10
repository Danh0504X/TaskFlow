import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { paymentService } from '../services/paymentService.js'

// Tạo đơn thanh toán VietQR cho gói PRO
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const result = await paymentService.createPaymentOrder(userId)

  res.status(StatusCodes.CREATED).json({
    message: 'Tạo đơn thanh toán thành công',
    data: result,
  })
})

// Lấy đơn PENDING dở dang (PAY-03 item 5)
export const getPendingOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const result = await paymentService.getPendingOrder(userId)

  res.status(StatusCodes.OK).json({
    message: 'Lấy đơn dở dang thành công',
    data: result,
  })
})

// Polling kiểm tra trạng thái thanh toán từ Frontend
export const checkPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentCode } = req.params
  const userId = req.user._id

  const result = await paymentService.checkPaymentStatus(paymentCode, userId)

  res.status(StatusCodes.OK).json({
    message: 'Lấy trạng thái thanh toán thành công',
    data: result,
  })
})

// Lấy lịch sử giao dịch cá nhân (PAY-05)
export const getUserTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const result = await paymentService.getUserTransactionHistory(userId)

  res.status(StatusCodes.OK).json({
    message: 'Lấy lịch sử giao dịch thành công',
    data: result,
  })
})

// Webhook tự động nhận thông báo từ SePay khi có biến động tiền (PAY-04, PAY-07, PAY-08)
export const handleSePayWebhook = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const result = await paymentService.handleSePayWebhook(req.body, authHeader)

  res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  })
})
