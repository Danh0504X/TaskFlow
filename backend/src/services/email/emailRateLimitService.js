import { StatusCodes } from 'http-status-codes'
import EmailRateLimit from '../../models/EmailRateLimit.js'
import ApiError from '../../utils/ApiError.js'
import { EMAIL_RATE_LIMIT } from '../../utils/constants.js'

const { MAX_ATTEMPTS, WINDOW_MS, BLOCK_MS } = EMAIL_RATE_LIMIT

const TOO_MANY_MESSAGE =
  'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 tiếng.'

// Kiểm tra & cập nhật rate limit theo cặp email + purpose.
// Tối đa 5 lần / 30 phút; vượt quá thì block 1 tiếng.
const checkEmailRateLimit = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date()

  const record = await EmailRateLimit.findOne({
    email: normalizedEmail,
    purpose,
  })

  // Chưa có record -> lần gửi đầu tiên
  if (!record) {
    await EmailRateLimit.create({
      email: normalizedEmail,
      purpose,
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      blockedUntil: null,
    })
    return
  }

  // Đang bị block
  if (record.blockedUntil && record.blockedUntil > now) {
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, TOO_MANY_MESSAGE)
  }

  // Đã qua window 30 phút -> reset đếm lại từ đầu
  if (now.getTime() - record.firstAttemptAt.getTime() >= WINDOW_MS) {
    record.attempts = 1
    record.firstAttemptAt = now
    record.lastAttemptAt = now
    record.blockedUntil = null
    await record.save()
    return
  }

  // Còn trong window, đã đạt ngưỡng -> block 1 tiếng
  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = new Date(now.getTime() + BLOCK_MS)
    record.lastAttemptAt = now
    await record.save()
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, TOO_MANY_MESSAGE)
  }

  // Còn trong window, chưa đạt ngưỡng -> tăng đếm
  record.attempts += 1
  record.lastAttemptAt = now
  await record.save()
}

export const emailRateLimitService = {
  checkEmailRateLimit,
}
