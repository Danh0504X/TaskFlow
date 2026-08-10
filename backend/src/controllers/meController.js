import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { issueService } from '../services/issueService.js'
import { sprintService } from '../services/sprintService.js'
import { aiGenerationService } from '../modules/ai/services/aiGeneration.service.js'

// Danh sách issue được giao cho user hiện tại, trải trên mọi project (trang "Việc của tôi").
export const getMyTasks = asyncHandler(async (req, res) => {
  const result = await issueService.getMyIssues(req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get my tasks successfully',
    data: result,
  })
})

// Các sprint đang chạy sắp hết hạn, trải trên mọi project (widget Dashboard).
export const getUpcomingSprints = asyncHandler(async (req, res) => {
  const result = await sprintService.getUpcomingSprints(req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get upcoming sprints successfully',
    data: result,
  })
})

// Hạn mức AI của user hiện tại (widget "Hạn mức AI" ở trang Hồ sơ) — cùng logic đếm/kiểm PRO
// với checkAiLimit.js (middleware chặn tạo lượt sinh), tránh lệch số giữa hiển thị và chặn thật.
export const getAiQuota = asyncHandler(async (req, res) => {
  const result = await aiGenerationService.getAiUsageToday(req.user)

  res.status(StatusCodes.OK).json({
    message: 'Get AI quota successfully',
    data: result,
  })
})
