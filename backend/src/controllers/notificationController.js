import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import Notification from '../models/notifications.js'

// Lấy danh sách thông báo của user hiện tại (có phân trang và lọc)
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query
  const query = { userId: req.user._id }

  if (isRead !== undefined) {
    query.isRead = isRead === 'true'
  }

  const totalItems = await Notification.countDocuments(query)
  const notifications = await Notification.find(query)
    .populate('actorId', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean()

  res.status(StatusCodes.OK).json({
    message: 'Get notifications successfully',
    data: {
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    },
  })
})

// Đánh dấu 1 thông báo là đã đọc
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { isRead: true },
    { new: true }
  )
    .populate('actorId', 'fullName avatarUrl')
    .lean()

  if (!notification) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Notification not found',
    })
  }

  res.status(StatusCodes.OK).json({
    message: 'Marked notification as read successfully',
    data: notification,
  })
})

// Đánh dấu tất cả thông báo là đã đọc
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  )

  res.status(StatusCodes.OK).json({
    message: 'Marked all notifications as read successfully',
    data: null,
  })
})

// Xóa 1 thông báo
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params
  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  }).lean()

  if (!notification) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Notification not found',
    })
  }

  res.status(StatusCodes.OK).json({
    message: 'Notification deleted successfully',
    data: notification,
  })
})

// Xóa toàn bộ thông báo
export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id })

  res.status(StatusCodes.OK).json({
    message: 'All notifications cleared successfully',
    data: null,
  })
})
