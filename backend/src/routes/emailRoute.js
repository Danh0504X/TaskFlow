import express from 'express'
import {
  sendVerifyCode,
  verifyEmail,
  forgotPassword,
  resetPassword,
  sendWelcome,
} from '../controllers/emailController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'
import {
  sendVerifyCodeSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js'

const router = express.Router()

// Public routes
router.post('/send-verify-code', validate(sendVerifyCodeSchema), sendVerifyCode)
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)

// Private route (cần đăng nhập) - dùng để test gửi email chào mừng
router.post('/welcome', protectedRoute, sendWelcome)

export default router
