import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import User from '../../models/users.js'
import ApiError from '../../utils/ApiError.js'
import { env } from '../../config/environment.js'
import {
  EMAIL_PURPOSE,
  EMAIL_REGEX,
  EMAIL_TOKEN_EXPIRES_MINUTES,
} from '../../utils/constants.js'
import { emailService } from './emailService.js'
import { emailTokenService } from './emailTokenService.js'
import { emailRateLimitService } from './emailRateLimitService.js'

// Response chung khi không muốn tiết lộ email có tồn tại hay không
const GENERIC_SENT_MESSAGE =
  'Nếu email tồn tại trong hệ thống, hướng dẫn đã được gửi tới hộp thư của bạn.'

const assertValidEmail = (email) => {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email không hợp lệ')
  }
}


const sendWelcomeEmail = async ({ to, name }) => {
  assertValidEmail(to)
  await emailService.sendEmailByTemplate({
    to,
    template: EMAIL_PURPOSE.WELCOME,
    data: { name },
  })
  return { message: 'Welcome email sent' }
}

// 1. Gửi mã xác thực email
const sendVerifyCode = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() })

  // Không tiết lộ email có tồn tại hay không
  if (!user) return { message: GENERIC_SENT_MESSAGE }

  if (user.isEmailVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email đã được xác thực')
  }

  // Check rate limit trước khi tạo mã mới
  await emailRateLimitService.checkEmailRateLimit(
    user.email,
    EMAIL_PURPOSE.VERIFY_EMAIL,
  )

  // Tạo mã OTP, hash & lưu (hàm create đã tự xoá mã cũ cùng email + purpose)
  const code = emailTokenService.generateOtpCode()
  await emailTokenService.createEmailToken({
    userId: user._id,
    email: user.email,
    purpose: EMAIL_PURPOSE.VERIFY_EMAIL,
    token: code,
  })

  await emailService.sendEmailByTemplate({
    to: user.email,
    template: EMAIL_PURPOSE.VERIFY_EMAIL,
    data: { code, expiresInMinutes: EMAIL_TOKEN_EXPIRES_MINUTES },
  })

  return { message: 'Đã gửi mã xác thực tới email của bạn.' }
}

// 2. Xác thực mã email
const verifyEmail = async ({ email, code }) => {
  const tokenDoc = await emailTokenService.verifyEmailToken({
    email,
    purpose: EMAIL_PURPOSE.VERIFY_EMAIL,
    token: code,
  })

  if (!tokenDoc) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Mã xác thực không đúng hoặc đã hết hạn',
    )
  }

  await User.updateOne({ _id: tokenDoc.userId }, { isEmailVerified: true })

  
  await emailTokenService.deleteEmailToken({
    email,
    purpose: EMAIL_PURPOSE.VERIFY_EMAIL,
  })

  return { message: 'Xác thực email thành công' }
}

// 3. Gửi email quên mật khẩu
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() })

  // Luôn trả response chung để không lộ email tồn tại hay không
  if (!user) return { message: GENERIC_SENT_MESSAGE }

  await emailRateLimitService.checkEmailRateLimit(
    user.email,
    EMAIL_PURPOSE.RESET_PASSWORD,
  )

  // Tạo reset token (create đã tự xoá token cũ cùng email + purpose)
  const token = emailTokenService.generateResetToken()
  await emailTokenService.createEmailToken({
    userId: user._id,
    email: user.email,
    purpose: EMAIL_PURPOSE.RESET_PASSWORD,
    token,
  })

  // Link reset build từ FRONTEND_URL, không hard-code
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(
    user.email,
  )}`

  await emailService.sendEmailByTemplate({
    to: user.email,
    template: EMAIL_PURPOSE.RESET_PASSWORD,
    data: { resetUrl, expiresInMinutes: EMAIL_TOKEN_EXPIRES_MINUTES },
  })

  return { message: GENERIC_SENT_MESSAGE }
}

// 4. Reset password bằng token
const resetPassword = async ({ email, token, newPassword }) => {
  const tokenDoc = await emailTokenService.verifyEmailToken({
    email,
    purpose: EMAIL_PURPOSE.RESET_PASSWORD,
    token,
  })

  if (!tokenDoc) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Token không hợp lệ hoặc đã hết hạn',
    )
  }

  const user = await User.findById(tokenDoc.userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng')
  }

  // Hash mật khẩu giống authService (bcrypt, salt rounds = 10)
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()

  // Token dùng 1 lần -> xoá ngay sau khi đổi mật khẩu thành công
  await emailTokenService.deleteEmailToken({
    email,
    purpose: EMAIL_PURPOSE.RESET_PASSWORD,
  })

  return { message: 'Đặt lại mật khẩu thành công' }
}

export const emailAccountService = {
  sendWelcomeEmail,
  sendVerifyCode,
  verifyEmail,
  forgotPassword,
  resetPassword,
}
