import { StatusCodes } from 'http-status-codes'
import User from '../models/users.js'
import { JwtProvider } from '../providers/JwtProvider.js'
import { env } from '../config/environment.js'

// Throttle ghi lastActiveAt: mọi request đều qua đây, nhưng ghi DB mỗi request thì quá tốn —
// 1 giờ mới cập nhật lại là đủ chính xác cho mục đích thống kê "hoạt động 7 ngày qua".
const ACTIVITY_THROTTLE_MS = 60 * 60 * 1000

// Không await — không được để việc ghi nhận hoạt động làm chậm hoặc làm fail request chính.
const touchLastActive = (user) => {
  if (user.lastActiveAt && Date.now() - user.lastActiveAt.getTime() < ACTIVITY_THROTTLE_MS) return
  User.updateOne({ _id: user._id }, { lastActiveAt: new Date() })
    .catch((err) => console.error('>> [protectedRoute] Failed to update lastActiveAt:', err.message))
}

export const protectedRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken

    if (!accessToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized',
      })
    }

    try {
      const decodedUser = await JwtProvider.verifyToken(
        accessToken,
        env.ACCESS_TOKEN_SECRET,
      )

      const user = await User.findById(decodedUser.userInfo._id)

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: 'User not found',
        })
      }

      if (user.status === 'inactive') {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'Your account is inactive. Please contact admin.',
        })
      }

      if (user.status === 'banned') {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'Your account has been banned. Please contact admin.',
        })
      }

      // Chặn cả access token đã lỡ cấp cho tài khoản chưa xác thực email (vd trước khi vá lỗi ở
      // authService.signIn) — không để request nào tiếp tục dùng được cho tới khi token tự hết hạn.
      if (!user.isEmailVerified) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'Vui lòng xác thực email trước khi đăng nhập.',
        })
      }

      req.user = user
      touchLastActive(user)

      next()
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError' || err.message.includes('expired')

      if (isExpired) {
        console.error(
          `>> [protectedRoute] ACCESS token EXPIRED — ${req.method} ${req.originalUrl}` +
            (err.expiredAt ? ` (expiredAt: ${err.expiredAt.toISOString()})` : ''),
        )
        return res.status(410).json({
          message: 'Need to refresh Access Token',
        })
      }

      console.error(
        `>> [protectedRoute] ACCESS token INVALID (${err.name}: ${err.message}) — ${req.method} ${req.originalUrl}`,
      )
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Invalid access token',
      })
    }
  } catch (error) {
    console.error('>> [protectedRoute] 500 Error:', error)

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
    })
  }
}