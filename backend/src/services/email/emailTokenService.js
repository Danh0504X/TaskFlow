import crypto from 'crypto'
import EmailToken from '../../models/EmailToken.js'
import { env } from '../../config/environment.js'
import { EMAIL_TOKEN_EXPIRES_MINUTES } from '../../utils/constants.js'

// Mã OTP 6 số (100000 - 999999), tránh số bắt đầu bằng 0
const generateOtpCode = () => crypto.randomInt(100000, 1000000).toString()

// Token reset password đủ mạnh (256 bit)
const generateResetToken = () => crypto.randomBytes(32).toString('hex')

// Hash token/mã bằng HMAC-SHA256 + secret. Không bao giờ lưu plain text.
const hashToken = (token) => {
  if (!env.EMAIL_TOKEN_SECRET) {
    throw new Error(
      'Thiếu EMAIL_TOKEN_SECRET trong backend/.env. Hãy thêm biến này rồi RESTART server (dotenv chỉ đọc .env lúc khởi động).',
    )
  }

  return crypto
    .createHmac('sha256', env.EMAIL_TOKEN_SECRET)
    .update(String(token))
    .digest('hex')
}

// Xoá toàn bộ token cũ cùng email + purpose (đảm bảo chỉ token mới nhất hiệu lực)
const deleteEmailToken = async ({ email, purpose }) => {
  await EmailToken.deleteMany({ email: email.toLowerCase().trim(), purpose })
}

// Tạo token mới: xoá token cũ trước, rồi lưu bản hash với expiresAt = now + 10 phút
const createEmailToken = async ({
  userId,
  email,
  purpose,
  token,
  expiresInMinutes = EMAIL_TOKEN_EXPIRES_MINUTES,
}) => {
  await deleteEmailToken({ email, purpose })

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  await EmailToken.create({
    userId,
    email: email.toLowerCase().trim(),
    purpose,
    tokenHash: hashToken(token),
    expiresAt,
  })

  return { expiresAt }
}

// Verify: hash mã user nhập rồi tìm token còn hạn (không chỉ dựa vào TTL của Mongo).
// Trả về document nếu hợp lệ, ngược lại null.
const verifyEmailToken = async ({ email, purpose, token }) => {
  const tokenHash = hashToken(token)

  return EmailToken.findOne({
    email: email.toLowerCase().trim(),
    purpose,
    tokenHash,
    expiresAt: { $gt: new Date() },
  })
}

export const emailTokenService = {
  generateOtpCode,
  generateResetToken,
  hashToken,
  createEmailToken,
  verifyEmailToken,
  deleteEmailToken,
}
