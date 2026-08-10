import { StatusCodes } from 'http-status-codes'
import AiGeneration from '../models/aiGenerations.js'
import { aiEnv } from '../modules/ai/config/aiEnv.js'

const startOfTodayUtc = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Chặn tạo lượt sinh AI mới nếu user đã đạt AI_DAILY_LIMIT lượt/ngày (đếm theo UTC, tính trực
 * tiếp trên các document AiGeneration đã có — không dùng counter riêng để tránh lệch dữ liệu).
 * Đặt SAU protectedRoute (cần req.user) + authorizeProjectRole, CHỈ trên route tạo lượt sinh
 * (POST .../ai/generations) — không áp cho các route AI khác (list/detail/accept/reject...).
 */
export const checkAiLimit = async (req, res, next) => {
  try {
    const user = req.user

    // Nếu tài khoản là PRO và còn hạn sử dụng -> Không giới hạn lượt sinh AI
    const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()
    if (isPro) {
      return next()
    }

    // Tài khoản FREE hoặc PRO đã hết hạn: Đếm số lượt dùng hôm nay
    const count = await AiGeneration.countDocuments({
      requestedBy: req.user._id,
      createdAt: { $gte: startOfTodayUtc() },
    })

    if (count >= aiEnv.AI_DAILY_LIMIT) {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        message: `Tài khoản FREE đã đạt giới hạn ${aiEnv.AI_DAILY_LIMIT} lượt sinh AI/ngày. Vui lòng nâng cấp gói PRO để tiếp tục!`,
        isLimitReached: true,
        dailyUsedCount: count,
        dailyLimit: aiEnv.AI_DAILY_LIMIT,
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
