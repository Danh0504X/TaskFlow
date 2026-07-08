import express from 'express'
import {
  signUp,
  checkEmail,
  verifyEmail,
  signIn,
  googleSignIn,
  signOut,
  refreshToken,
  changePassword,
  getMe,
} from '../controllers/authController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'
import {
  signUpSchema,
  checkEmailSchema,
  verifyEmailSchema,
  signInSchema,
  googleSignInSchema,
  changePasswordSchema,
} from '../validations/auth.validation.js'

const router = express.Router()

router.post('/sign-up', validate(signUpSchema), signUp)

router.post('/check-email', validate(checkEmailSchema), checkEmail)

router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)

router.post('/sign-in', validate(signInSchema), signIn)

router.post('/google', validate(googleSignInSchema), googleSignIn)

router.post('/refresh-token', refreshToken)

router.post('/sign-out', signOut)

// Lấy thông tin user hiện tại — cần đăng nhập (accessToken trong cookie).
router.get('/me', protectedRoute, getMe)

// Đổi mật khẩu — controller/service đã có sẵn từ trước nhưng chưa từng được gắn route.
router.patch(
  '/change-password',
  protectedRoute,
  validate(changePasswordSchema),
  changePassword,
)

export default router
