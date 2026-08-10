import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { adminAiService } from '../services/adminAiService.js'

// [Admin] Tổng quan giám sát AI (lượt sinh, tỉ lệ lỗi/chấp nhận, phễu, theo loại, cảnh báo).
export const getOverview = asyncHandler(async (req, res) => {
  const result = await adminAiService.getOverview()

  res.status(StatusCodes.OK).json({
    message: 'Get AI overview successfully',
    data: result,
  })
})

// [Admin] Bảng xếp hạng token/lượt sinh theo user — query ?timeframe=7d|30d|all.
export const getQuotaLeaderboard = asyncHandler(async (req, res) => {
  const result = await adminAiService.getQuotaLeaderboard(req.query.timeframe)

  res.status(StatusCodes.OK).json({
    message: 'Get AI quota leaderboard successfully',
    data: result,
  })
})
