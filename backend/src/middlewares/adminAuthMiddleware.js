import { StatusCodes } from 'http-status-codes'
import { USER_ROLE } from '../utils/constants.js'

// Chỉ cho phép tài khoản có role 'admin' đi tiếp.
// LƯU Ý: phải đặt SAU protectedRoute (cần req.user đã được gán).
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Unauthorized',
    })
  }

  if (req.user.role !== USER_ROLE.ADMIN) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Admin permission required',
    })
  }

  next()
}
