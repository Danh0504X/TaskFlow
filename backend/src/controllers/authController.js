import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { authService } from '../services/authService.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { env } from '../config/enviroment.js'

const isProduction = env.BUILD_MODE === 'production'

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  // Dev (http://localhost) không dùng secure + sameSite 'none' nếu không trình duyệt sẽ không lưu cookie
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: ms('14 days'),
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

export const signOut = asyncHandler(async (req, res) => {
  console.log('Call: ⛳authController.js -> signOut()')
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

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})

export const verifyResetToken = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetToken(req.body)
  res.status(StatusCodes.OK).json(result)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body)
  res.status(StatusCodes.OK).json(result)
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
