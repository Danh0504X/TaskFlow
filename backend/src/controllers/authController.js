import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { authService } from '../services/authService.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { env } from '../config/environment.js'

const isProduction = env.BUILD_MODE === 'production'

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
}

const AUTH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: ms(env.REFRESH_TOKEN_TTL),
}

// Gắn access/refresh token vào cookie (chỉ set token nào được truyền vào)
const setAuthCookies = (res, { accessToken, refreshToken } = {}) => {
  if (accessToken) res.cookie('accessToken', accessToken, AUTH_COOKIE_OPTIONS)
  if (refreshToken) res.cookie('refreshToken', refreshToken, AUTH_COOKIE_OPTIONS)
}

// Xoá cookie auth khi đăng xuất
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
}

export const signUp = asyncHandler(async (req, res) => {
  console.log('sign up') // Sign up
  const result = await authService.signUp(req.body)
  res.status(StatusCodes.CREATED).json(result)
})

export const checkEmail = asyncHandler(async (req, res) => {
  const result = await authService.checkEmailAvailability(req.body?.email)
  res.status(StatusCodes.OK).json(result)
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmailAndLogin(req.body)
  const { accessToken, refreshToken } = result.data

  setAuthCookies(res, { accessToken, refreshToken })

  res.status(StatusCodes.OK).json({
    message: 'Email verified successfully',
    ...result,
  })
})

export const signOut = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  await authService.signOut(refreshToken)

  clearAuthCookies(res)
  res.status(StatusCodes.OK).json({ message: 'Sign out successful' })
})

export const signIn = asyncHandler(async (req, res) => {
  const result = await authService.signIn(req.body)
  const { accessToken, refreshToken, fullName } = result.data

  setAuthCookies(res, { accessToken, refreshToken })

  res.status(StatusCodes.OK).json({
    message: `Sign in successful: User[${fullName}]`,
    ...result // Wrap data as status: success
  })
})

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  const { accessToken } = await authService.refreshToken(refreshToken)

  setAuthCookies(res, { accessToken })

  res.status(StatusCodes.OK).json({
    accessToken,
  })
})

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body)
  res.status(StatusCodes.OK).json(result)
})

// Trả thông tin user đang đăng nhập (dựa vào accessToken trong cookie).
// protectedRoute đã xác thực token & gắn req.user trước khi vào đây.
export const getMe = asyncHandler(async (req, res) => {
  const userInfo = authService.getMe(req.user)
  res.status(StatusCodes.OK).json({
    message: 'Get current user successfully',
    data: { userInfo },
  })
})

export const googleSignIn = asyncHandler(async (req, res) => {
  const result = await authService.signInWithGoogle(req.body)
  const { accessToken, refreshToken, fullName } = result.data

  setAuthCookies(res, { accessToken, refreshToken })

  res.status(StatusCodes.OK).json({
    message: `Sign in successful: User[${fullName}]`,
    ...result
  })
})
