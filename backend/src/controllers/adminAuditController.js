import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import AuditLog from '../models/AuditLog.js'

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
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom)
    if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo)
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

// Ghi 1 nhật ký mới vào MongoDB
export const createAuditLog = asyncHandler(async (req, res) => {
  const { action, targetLabel, detail, adminName, adminEmail } = req.body

  if (!action || !targetLabel) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Thiếu action hoặc targetLabel' })
    return
  }

  const log = await AuditLog.create({
    adminName: adminName || req.user?.fullName || 'System Admin',
    adminEmail: adminEmail || req.user?.email || 'admin@gmail.com',
    action,
    targetLabel,
    detail: detail || '',
  })

  res.status(StatusCodes.CREATED).json({
    message: 'Tạo nhật ký thành công',
    data: log,
  })
})
