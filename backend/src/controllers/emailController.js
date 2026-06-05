import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { emailAccountService } from '../services/email/emailAccountService.js'

// POST /api/email/send-verify-code  -> gửi mã xác thực email
export const sendVerifyCode = asyncHandler(async (req, res) => {
  const result = await emailAccountService.sendVerifyCode(req.body)
  res.status(StatusCodes.OK).json(result)
})

// POST /api/email/verify-email  -> xác thực mã email
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await emailAccountService.verifyEmail(req.body)
  res.status(StatusCodes.OK).json(result)
})

// POST /api/email/forgot-password  -> gửi link đổi mật khẩu
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await emailAccountService.forgotPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})

// POST /api/email/reset-password  -> đổi mật khẩu bằng token
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await emailAccountService.resetPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})

// POST /api/email/welcome  -> gửi email chào mừng (route protected, dùng để test)
export const sendWelcome = asyncHandler(async (req, res) => {
  const result = await emailAccountService.sendWelcomeEmail({
    to: req.user.email,
    name: req.user.fullName,
  })
  res.status(StatusCodes.OK).json(result)
})
