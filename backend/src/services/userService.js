import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import User from '../models/users.js'
import ApiError from '../utils/ApiError.js'
import { EMAIL_REGEX, USER_ROLE } from '../utils/constants.js'

const VALID_ROLES = Object.values(USER_ROLE)
const VALID_STATUSES = ['active', 'inactive', 'banned']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Lấy danh sách tài khoản 
const getAllUsers = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit

  // Lọc tùy chọn theo role / status / từ khóa (email hoặc tên).
  const filter = {}
  if (query.role && VALID_ROLES.includes(query.role)) filter.role = query.role
  if (query.status && VALID_STATUSES.includes(query.status)) {
    filter.status = query.status
  }
  if (query.search) {
    const keyword = String(query.search).trim()
    filter.$or = [
      { email: { $regex: keyword, $options: 'i' } },
      { fullName: { $regex: keyword, $options: 'i' } },
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  return { users, total, page, limit }
}

// Lấy chi tiết 1 tài khoản.
const getUserById = async (userId) => {
  ensureValidObjectId(userId, 'user id')

  const user = await User.findById(userId).select('-passwordHash')
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  return user
}

// Admin tạo tài khoản mới (mặc định đã xác thực email, role 'user').
const createUser = async (body = {}) => {
  const { email, password, fullName, role, status } = body

  if (!email || !password || !fullName) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Email, password and full name are required',
    )
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format')
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid role')
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status')
  }

  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await User.create({
    email: normalizedEmail,
    fullName: fullName.trim(),
    passwordHash,
    authProvider: 'local',
    isEmailVerified: true, // admin tạo trực tiếp -> coi như đã xác thực 
    role: role || USER_ROLE.USER,
    status: status || 'active',
  })

  // Không trả passwordHash 
  return user.toJSON()
}

// Admin cập nhật tài khoản. Chỉ cho phép sửa các field whitelist.
const updateUser = async (userId, body = {}) => {
  ensureValidObjectId(userId, 'user id')

  const payload = {}

  if (body.fullName !== undefined) {
    if (!body.fullName || !body.fullName.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Full name cannot be empty')
    }
    payload.fullName = body.fullName.trim()
  }

  if (body.email !== undefined) {
    if (!EMAIL_REGEX.test(body.email)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format')
    }
    const normalizedEmail = body.email.toLowerCase().trim()
    // Đảm bảo email mới không trùng tài khoản khác.
    const duplicated = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    })
    if (duplicated) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
    }
    payload.email = normalizedEmail
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid role')
    }
    payload.role = body.role
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status')
    }
    payload.status = body.status
  }

  if (body.password !== undefined) {
    if (!body.password || body.password.length < 6) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Password must be at least 6 characters',
      )
    }
    payload.passwordHash = await bcrypt.hash(body.password, 10)
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No valid fields to update')
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select('-passwordHash')

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  return user
}

// Admin xóa tài khoản. Không cho tự xóa chính mình.
const deleteUser = async (userId, currentAdminId) => {
  ensureValidObjectId(userId, 'user id')

  if (String(userId) === String(currentAdminId)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You cannot delete your own account',
    )
  }

  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  return { _id: userId }
}

export const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
