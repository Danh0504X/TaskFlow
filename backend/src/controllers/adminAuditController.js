import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import AuditLog from '../models/AuditLog.js'
import ApiError from '../utils/ApiError.js'
import { AUDIT_ACTION } from '../utils/constants.js'

const ALLOWED_ACTIONS = new Set(Object.values(AUDIT_ACTION))

// Parse 1 mốc ngày từ query string; throw lỗi rõ ràng thay vì để lọt Invalid Date vào query Mongo.
const parseDateQuery = (value, label) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${label} không hợp lệ`)
  }
  return date
}

// Lấy danh sách nhật ký hệ thống (Audit Log) từ MongoDB với phân trang và bộ lọc
export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const skip = (page - 1) * limit

  const filter = {}
  if (req.query.action) filter.action = req.query.action
  if (req.query.adminEmail) {
    filter.adminEmail = { $regex: req.query.adminEmail.trim(), $options: 'i' }
  }
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {}
    if (req.query.dateFrom) filter.createdAt.$gte = parseDateQuery(req.query.dateFrom, 'dateFrom')
    if (req.query.dateTo) filter.createdAt.$lte = parseDateQuery(req.query.dateTo, 'dateTo')
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  res.status(StatusCodes.OK).json({
    message: 'Lấy nhật ký hệ thống thành công',
    data: { items, total, page, limit },
  })
})

// Ghi 1 nhật ký mới vào MongoDB. adminName/adminEmail luôn lấy từ req.user (admin đang đăng
// nhập) — KHÔNG nhận từ body, tránh admin tự khai danh tính người khác vào nhật ký.
export const createAuditLog = asyncHandler(async (req, res) => {
  const { action, targetLabel, detail, targetId } = req.body

  if (!action || !targetLabel) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Thiếu action hoặc targetLabel' })
    return
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'action không hợp lệ' })
    return
  }

  const log = await AuditLog.create({
    adminName: req.user.fullName,
    adminEmail: req.user.email,
    action,
    targetId: targetId || null,
    targetLabel,
    detail: detail || '',
  })

  res.status(StatusCodes.CREATED).json({
    message: 'Tạo nhật ký thành công',
    data: log,
  })
})
