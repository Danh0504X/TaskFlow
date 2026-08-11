import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { adminOverviewService } from '../services/adminOverviewService.js'

// [Admin] Tổng quan hệ thống: người dùng, doanh thu SePay, cảnh báo AI cần xử lý.
export const getOverview = asyncHandler(async (req, res) => {
  const result = await adminOverviewService.getOverview()

  res.status(StatusCodes.OK).json({
    message: 'Get admin overview successfully',
    data: result,
  })
})
