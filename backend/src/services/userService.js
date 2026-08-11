import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import User from '../models/users.js'
import AuditLog from '../models/AuditLog.js'
import ApiError from '../utils/ApiError.js'
import { AUDIT_ACTION, EMAIL_REGEX, USER_ROLE } from '../utils/constants.js'

const VALID_ROLES = Object.values(USER_ROLE)
const VALID_STATUSES = ['active', 'inactive', 'banned']

// Tên collection thật của model AiGeneration (Mongoose tự suy 'ai_generation' -> 'ai_generations',
// xem models/aiGenerations.js) — $lookup cần tên collection, không phải tên model.
const AI_GENERATIONS_COLLECTION = 'ai_generations'

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  tokensDesc: { aiTokensUsed: -1, createdAt: -1 },
  tokensAsc: { aiTokensUsed: 1, createdAt: -1 },
}

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

  const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.newest

  // Dùng aggregate (không phải find()) vì cần sort/phân trang theo aiTokensUsed — field này
  // không có sẵn trên User, phải $lookup + cộng dồn TRƯỚC $skip/$limit thì thứ tự trang mới
  // đúng (tính token sau khi đã phân trang, như bản trước, chỉ đúng khi sort mặc định theo
  // createdAt). Không lưu counter riêng trên User để tránh lệch dữ liệu gốc.
  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: AI_GENERATIONS_COLLECTION,
          localField: '_id',
          foreignField: 'requestedBy',
          as: '_aiGenerations',
        },
      },
      { $addFields: { aiTokensUsed: { $sum: '$_aiGenerations.tokensUsed' } } },
      { $project: { _aiGenerations: 0, passwordHash: 0 } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]),
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

// Ghi nhật ký hệ thống cho các thay đổi nhạy cảm (khoá/mở khoá, đổi vai trò) — so sánh giá
// trị trước/sau để không ghi log khi field đó thực ra không đổi.
const logUserChanges = async ({ before, payload, user, admin }) => {
  if (!admin) return

  const entries = []
  if (payload.status !== undefined && payload.status !== before.status) {
    entries.push({
      action: payload.status === 'active' ? AUDIT_ACTION.USER_UNLOCK : AUDIT_ACTION.USER_LOCK,
      detail: `Đổi trạng thái: ${before.status} → ${payload.status}`,
    })
  }
  if (payload.role !== undefined && payload.role !== before.role) {
    entries.push({
      action: AUDIT_ACTION.USER_ROLE_CHANGE,
      detail: `Đổi vai trò: ${before.role} → ${payload.role}`,
    })
  }
  if (entries.length === 0) return

  await AuditLog.insertMany(
    entries.map((entry) => ({
      adminName: admin.fullName,
      adminEmail: admin.email,
      targetId: user._id,
      targetLabel: user.email,
      ...entry,
    })),
  )
}

// Admin cập nhật tài khoản. Chỉ cho phép sửa các field whitelist.
// `admin` là req.user (tài khoản admin đang thao tác) — dùng để ghi Nhật ký hệ thống.
const updateUser = async (userId, body = {}, admin) => {
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

  const before = await User.findById(userId).select('role status')
  if (!before) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select('-passwordHash')

  await logUserChanges({ before, payload, user, admin })

  return user
}

// Admin xóa tài khoản. Không cho tự xóa chính mình.
// `admin` là req.user (tài khoản admin đang thao tác) — dùng để ghi Nhật ký hệ thống.
const deleteUser = async (userId, admin) => {
  ensureValidObjectId(userId, 'user id')

  if (String(userId) === String(admin._id)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You cannot delete your own account',
    )
  }

  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  await AuditLog.create({
    adminName: admin.fullName,
    adminEmail: admin.email,
    action: AUDIT_ACTION.USER_DELETE,
    targetId: user._id,
    targetLabel: user.email,
  })

  return { _id: userId }
}

export const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
