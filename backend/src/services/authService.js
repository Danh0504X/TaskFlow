import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import User from '../models/users.js'
import { JwtProvider } from '../providers/JwtProvider.js'
import { sessionService } from './sessionService.js'
import { env } from '../config/environment.js'
import ApiError from '../utils/ApiError.js'
import { EMAIL_PURPOSE } from '../utils/constants.js'
import { emailAccountService } from './email/emailAccountService.js'
import { emailTokenService } from './email/emailTokenService.js'

const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL
const REFRESH_TOKEN_TTL = env.REFRESH_TOKEN_TTL

const buildUserInfo = (user) => ({
  _id: user._id,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
  status: user.status,
  role: user.role,
  hasPassword: Boolean(user.passwordHash || user.hasPassword), 
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

  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })

  // Đã có tài khoản ĐÃ xác thực -> email thực sự bị trùng
  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // Tồn tại nhưng CHƯA xác thực -> cập nhật lại thông tin (cho phép đăng ký lại).
  // Chưa tồn tại -> tạo mới ở trạng thái chưa xác thực.
  if (existingUser) {
    existingUser.fullName = fullName
    existingUser.passwordHash = passwordHash
    await existingUser.save()
  } else {
    await User.create({
      email: normalizedEmail,
      fullName,
      passwordHash,
      authProvider: 'local',
      isEmailVerified: false,
      status: 'active',
    })
  }

  // Gửi mã xác thực; user chỉ đăng nhập được sau khi nhập đúng mã.
  await emailAccountService.sendVerifyCode({ email: normalizedEmail })

  return {
    message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhập mã xác thực.',
    data: { email: normalizedEmail, needVerifyEmail: true },
  }
}

// Kiểm tra email đã dùng được hay chưa (cho bước 1 form đăng ký).
// Mirror đúng điều kiện ở signUp: chỉ coi là "đã dùng" khi tài khoản ĐÃ xác thực.
// Tài khoản tồn tại nhưng chưa xác thực -> vẫn cho đăng ký lại nên xem là còn trống.
const checkEmailAvailability = async (email) => {
  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })
  const taken = Boolean(existingUser && existingUser.isEmailVerified)

  return { email: normalizedEmail, available: !taken }
}

// Xác thực mã email sau khi đăng ký -> set isEmailVerified, gửi welcome, đăng nhập luôn.
const verifyEmailAndLogin = async (body) => {
  const { email, code } = body

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

  const user = await User.findById(tokenDoc.userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  ensureAccountCanSignIn(user)

  user.isEmailVerified = true
  await user.save()

  // Xử lý tự động tham gia dự án nếu có inviteToken từ email mời
  const { inviteToken } = body
  if (inviteToken) {
    try {
      const decoded = await JwtProvider.verifyToken(inviteToken, env.ACCESS_TOKEN_SECRET)
      if (
        decoded &&
        decoded.projectId &&
        decoded.email &&
        decoded.email.toLowerCase() === email.toLowerCase()
      ) {
        const Project = (await import('../models/projects.js')).default
        const project = await Project.findOne({ _id: decoded.projectId, isDeleted: false })
        if (project) {
          const existingMember = project.members.find(
            (m) => m.userId.toString() === user._id.toString()
          )
          if (!existingMember) {
            project.members.push({
              userId: user._id,
              role: 'MEMBER',
              status: 'ACTIVE',
            })
            await project.save()
          } else if (existingMember.status !== 'ACTIVE') {
            existingMember.status = 'ACTIVE'
            existingMember.role = 'MEMBER'
            await project.save()
          }
        }
      }
    } catch (err) {
      console.error('🔥 Tự động gia nhập dự án thất bại:', err.message)
    }
  }

  // Token dùng 1 lần -> xoá ngay sau khi xác thực thành công
  await emailTokenService.deleteEmailToken({
    email,
    purpose: EMAIL_PURPOSE.VERIFY_EMAIL,
  })

  // Gửi email chào mừng (fire-and-forget: lỗi gửi mail không chặn đăng nhập)
  emailAccountService
    .sendWelcomeEmail({ to: user.email, name: user.fullName })
    .catch((err) => console.error('🔥 Welcome email failed:', err.message))

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

const signIn = async (body) => {
  const { email, password } = body

  const login = email.toLowerCase().trim()
  const user = await User.findOne({ email: login })

  // BỎ KIỂM TRA authProvider !== 'local'. 
  // Bất kỳ tài khoản nào (Local hay Google) chỉ cần ĐÃ CÓ passwordHash đều được phép đăng nhập bằng mật khẩu.
  if (!user || !user.passwordHash) {
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

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  // TRƯỜNG HỢP 1: Tài khoản ĐÃ có mật khẩu -> Bắt buộc kiểm tra mật khẩu hiện tại
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is required')
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mật khẩu hiện tại không chính xác')
    }

    const isSameAsOldPassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSameAsOldPassword) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      )
    }
  }
  // TRƯỜNG HỢP 2: Tài khoản CHƯA có mật khẩu (tài khoản Google) -> Bỏ qua kiểm tra mật khẩu cũ

  // Tiến hành mã hóa và lưu mật khẩu mới
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()

  return { message: 'Password updated successfully' }
}
// Tự cập nhật hồ sơ cá nhân (hiện chỉ cho sửa fullName — xem updateProfileSchema).
const updateProfile = async (userId, { fullName }) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  user.fullName = fullName
  await user.save()

  return buildUserInfo(user)
}

const signInWithGoogle = async ({ accessToken }) => {
  let googlePayload
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🔥 Google userinfo fetch failed status:', response.status, 'body:', errorText)
      throw new Error('Google token invalid')
    }
    googlePayload = await response.json()
  } catch (error) {
    console.error('🔥 Error during signInWithGoogle fetch:', error)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google access token')
  }

  const { sub: googleId, email, name, picture, email_verified } = googlePayload
  if (!googleId || !email) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Google profile')
  }

  // Google có thể trả email_verified dạng boolean true hoặc chuỗi 'true'.
  const isGoogleEmailVerified =
    email_verified === true || email_verified === 'true'

  const normalizedEmail = email.toLowerCase().trim()

  // Tìm theo googleId (đã từng đăng nhập Google) hoặc theo email (đã đăng ký
  // local cùng email) -> gián tiếp liên kết 2 tài khoản cùng email.
  let user = await User.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  })

  if (user) {
    ensureAccountCanSignIn(user)

    // Tài khoản đã có nhưng CHƯA gắn Google (vd đăng ký bằng local/mật khẩu):
    // chỉ cho phép liên kết khi email đã được Google xác minh, tránh việc dùng
    // email chưa xác minh để chiếm tài khoản người khác.
    const isLinkingGoogle = !user.googleId
    if (isLinkingGoogle && !isGoogleEmailVerified) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Email chưa được Google xác minh nên không thể liên kết với tài khoản hiện có.',
      )
    }

    // Gắn Google vào tài khoản đang có. Giữ nguyên authProvider & passwordHash
    // để tài khoản local vẫn đăng nhập được bằng cả mật khẩu lẫn Google.
    if (!user.googleId) user.googleId = googleId
    user.isEmailVerified = true
    if (!user.avatarUrl && picture) user.avatarUrl = picture
    await user.save()
  } else {
    // Chưa có tài khoản nào -> tạo mới bằng Google (yêu cầu email đã xác minh).
    if (!isGoogleEmailVerified) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Google email is not verified')
    }

    user = await User.create({
      fullName: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
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

// Lấy thông tin user hiện tại từ user doc đã được protectedRoute gắn vào req.
// Dùng cho GET /auth/me (khôi phục phiên khi tải lại app).
const getMe = (user) => buildUserInfo(user)

export const authService = {
  signUp,
  checkEmailAvailability,
  verifyEmailAndLogin,
  signIn,
  signInWithGoogle,
  signOut,
  refreshToken,
  changePassword,
  updateProfile,
  getMe,
}
