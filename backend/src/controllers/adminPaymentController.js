import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { paymentService } from '../services/paymentService.js'

// Lấy danh sách giao dịch lỗi chờ xử lý thủ công (Admin Queue)
export const getPendingResolutions = asyncHandler(async (req, res) => {
  const result = await paymentService.getPendingResolutions()

  res.status(StatusCodes.OK).json({
    message: 'Lấy danh sách chờ duyệt thành công',
    data: result,
  })
})

// CSKH / Admin duyệt 1-Click cho giao dịch bị lỗi (thiếu tiền, sai mã)
export const resolveTransactionManually = asyncHandler(async (req, res) => {
  const { transactionId } = req.params
  const { userId, daysToAdd, adminNote } = req.body
  const adminId = req.user._id

  const result = await paymentService.resolveTransactionManually({
    transactionId,
    userId,
    daysToAdd: Number(daysToAdd) || 30,
    adminNote,
    adminId,
  })

  res.status(StatusCodes.OK).json({
    message: 'Duyệt thủ công & Nâng cấp PRO cho người dùng thành công',
    data: result,
  })
})

// Tìm kiếm nhanh User theo Email hoặc Tên để gán đơn lỗi
export const searchUsersForResolution = asyncHandler(async (req, res) => {
  const { query } = req.query
  const result = await paymentService.searchUsersForResolution(query)

  res.status(StatusCodes.OK).json({
    message: 'Tìm kiếm người dùng thành công',
    data: result,
  })
})
