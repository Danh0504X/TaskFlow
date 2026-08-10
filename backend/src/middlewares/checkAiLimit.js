import { StatusCodes } from 'http-status-codes'
import { aiGenerationService } from '../modules/ai/services/aiGeneration.service.js'

/**
 * Chặn tạo lượt sinh AI mới nếu user FREE (hoặc PRO đã hết hạn) đã đạt AI_DAILY_LIMIT lượt/ngày.
 * Đặt SAU protectedRoute (cần req.user) + authorizeProjectRole, CHỈ trên route tạo lượt sinh
 * (POST .../ai/generations, POST .../ai/clarify) — không áp cho các route AI khác.
 *
 * Logic đếm/kiểm PRO dùng chung với GET /me/ai-quota (xem aiGenerationService.getAiUsageToday)
 * — 1 nguồn duy nhất, tránh 2 nơi tự tính rồi lệch nhau.
 */
export const checkAiLimit = async (req, res, next) => {
  try {
    const { used, limit, isPro } = await aiGenerationService.getAiUsageToday(req.user)

    if (!isPro && used >= limit) {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        message: `Tài khoản FREE đã đạt giới hạn ${limit} lượt sinh AI/ngày. Vui lòng nâng cấp gói PRO để tiếp tục!`,
        isLimitReached: true,
      })
    }

    next()
  } catch (error) {
    console.error('>> [checkAiLimit] Error:', error)

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
    })
  }
}
