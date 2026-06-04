import Session from '../modles/sessions.js'

// Thời gian sống của session / refresh token (14 ngày)
const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Tạo session mới gắn với refresh token khi người dùng đăng nhập.
 */
const createSession = async (userId, refreshToken) => {
  return await Session.create({
    userId,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  })
}

/**
 * Tìm session theo refresh token.
 */
const findByRefreshToken = async (refreshToken) => {
  return await Session.findOne({ refreshToken })
}

/**
 * Xoá session theo refresh token (dùng khi đăng xuất).
 */
const deleteByRefreshToken = async (refreshToken) => {
  return await Session.deleteOne({ refreshToken })
}

/**
 * Xoá session theo _id (dùng khi session hết hạn / token không hợp lệ).
 */
const deleteById = async (sessionId) => {
  return await Session.deleteOne({ _id: sessionId })
}

export const sessionService = {
  createSession,
  findByRefreshToken,
  deleteByRefreshToken,
  deleteById,
  REFRESH_TOKEN_TTL_MS,
}
