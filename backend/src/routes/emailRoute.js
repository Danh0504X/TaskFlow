import express from 'express'
import {
  sendVerifyCode,
  verifyEmail,
  forgotPassword,
  resetPassword,
  sendWelcome,
} from '../controllers/emailController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/send-verify-code', sendVerifyCode)
router.post('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Private route (cần đăng nhập) - dùng để test gửi email chào mừng
router.post('/welcome', protectedRoute, sendWelcome)

export default router
