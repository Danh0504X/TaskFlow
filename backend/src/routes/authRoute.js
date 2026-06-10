import express from 'express'
import {
  signUp,
  checkEmail,
  verifyEmail,
  signIn,
  googleSignIn,
  signOut,
  refreshToken,
  getMe,
} from '../controllers/authController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/sign-up', signUp)

router.post('/check-email', checkEmail)

router.post('/verify-email', verifyEmail)

router.post('/sign-in', signIn)

router.post('/google', googleSignIn)

router.post('/refresh-token', refreshToken)

router.post('/sign-out', signOut)

// Lấy thông tin user hiện tại — cần đăng nhập (accessToken trong cookie).
router.get('/me', protectedRoute, getMe)

export default router
