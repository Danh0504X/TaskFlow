import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import User from '../modles/users.js'
import { JwtProvider } from '../providers/JwtProvider.js'
import { sessionService } from './sessionService.js'
import { env } from '../config/enviroment.js'
import ApiError from '../utils/ApiError.js'
import { EMAIL_REGEX } from '../utils/constants.js'

// import { emailService } from './emailService.js'
// import ResetPassword from '../models/ResetPassword.js'
// import ResetPasswordRateLimit from '../models/ResetPasswordRateLimit.js'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '14d'

const buildUserInfo = (user) => ({
  _id: user._id,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
  status: user.status,
})

const ensureAccountCanSignIn = (user) => {
  if (user.status === 'inactive') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your account is inactive. Please contact admin.',
    )
  }

  if (user.status === 'banned') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your account has been banned. Please contact admin.',
    )
  }
}

const generateTokens = async (userInfo) => {
  const accessToken = await JwtProvider.generateToken(
    { userInfo },
    env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_TTL,
  )

  const refreshToken = await JwtProvider.generateToken(
    { userInfo },
    env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_TTL,
  )

  return { accessToken, refreshToken }
}

const signUp = async (body) => {
  const { email, password, fullName } = body

  if (!email || !password || !fullName) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Email, password and full name are required!',
    )
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format')
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() })

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await User.create({
    email,
    fullName,
    passwordHash,
    authProvider: 'local',
    isEmailVerified: false,
    status: 'active',
  })

  return {
    message: 'User created successfully',
    data: {
      userInfo: buildUserInfo(user),
    },
  }
}

const signIn = async (body) => {
  const { email, password } = body

  if (!email || !password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Email and password are required',
    )
  }

  const login = email.toLowerCase().trim()
  const user = await User.findOne({ email: login })

  if (!user || user.authProvider !== 'local' || !user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')
  }

  ensureAccountCanSignIn(user)

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')
  }

  const userInfo = buildUserInfo(user)
  const { accessToken, refreshToken } = await generateTokens(userInfo)
  await sessionService.createSession(user._id, refreshToken)

  return {
    status: 'success',
    data: {
      userInfo,
      accessToken,
      refreshToken,
      fullName: user.fullName,
    },
  }
}

const signOut = async (refreshToken) => {
  if (refreshToken) {
    await sessionService.deleteByRefreshToken(refreshToken)
  }

  return { message: 'Sign out successful' }
}

const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is required')
  }

  const session = await sessionService.findByRefreshToken(refreshToken)
  if (!session) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session not found')
  }

  if (session.expiresAt < new Date()) {
    await sessionService.deleteById(session._id)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired')
  }

  let decoded
  try {
    decoded = await JwtProvider.verifyToken(refreshToken, env.REFRESH_TOKEN_SECRET)
  } catch (err) {
    await sessionService.deleteById(session._id)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token')
  }

  const user = await User.findById(decoded.userInfo?._id)
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found')
  }

  ensureAccountCanSignIn(user)

  const accessToken = await JwtProvider.generateToken(
    { userInfo: buildUserInfo(user) },
    env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_TTL,
  )

  return { accessToken }
}

const forgotPassword = async () => {
  // Temporarily disabled because email service/reset-password models are commented out.
  // const emailSent = await emailService.sendPasswordResetEmail(user.email, token)
  throw new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    'Forgot password is temporarily disabled.',
  )
}

const verifyResetToken = async () => {
  // Temporarily disabled because reset-password models are commented out.
  throw new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    'Reset token verification is temporarily disabled.',
  )
}

const resetPassword = async () => {
  // Temporarily disabled because email service/reset-password models are commented out.
  throw new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    'Reset password is temporarily disabled.',
  )
}

const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Current and new password are required')
  }

  if (newPassword.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'New password must be at least 6 characters long',
    )
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  if (user.authProvider !== 'local' || !user.passwordHash) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password can only be changed for local accounts',
    )
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect current password')
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()

  return { message: 'Password changed successfully' }
}

const signInWithGoogle = async ({ accessToken }) => {
  if (!accessToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Google access token is required')
  }

  let googlePayload
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) throw new Error('Google token invalid')
    googlePayload = await response.json()
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google access token')
  }

  const { sub: googleId, email, name, picture } = googlePayload
  if (!googleId || !email) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google profile')
  }

  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  })

  if (user) {
    ensureAccountCanSignIn(user)
    user.googleId = user.googleId || googleId
    user.authProvider = user.authProvider || 'google'
    user.isEmailVerified = true
    user.avatarUrl = user.avatarUrl || picture || null
    await user.save()
  } else {
    user = await User.create({
      fullName: name || email.split('@')[0],
      email,
      avatarUrl: picture || null,
      authProvider: 'google',
      googleId,
      isEmailVerified: true,
      status: 'active',
    })
  }

  const userInfo = buildUserInfo(user)
  const { accessToken: appAccessToken, refreshToken: appRefreshToken } =
    await generateTokens(userInfo)
  await sessionService.createSession(user._id, appRefreshToken)

  return {
    status: 'success',
    data: {
      userInfo,
      accessToken: appAccessToken,
      refreshToken: appRefreshToken,
      fullName: user.fullName,
    },
  }
}

export const authService = {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
}
