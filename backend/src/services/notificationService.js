import Notification from '../models/notifications.js'

export const notificationService = {
  createNotification: async ({ userId, actorId, projectId, type, entityType, entityId, title, message }) => {
    try {
      const newNotif = await Notification.create({
        userId,
        actorId,
        projectId,
        type,
        entityType,
        entityId,
        title,
        message,
      })

      const populatedNotif = await Notification.findById(newNotif._id)
        .populate('actorId', 'fullName avatarUrl')
        .lean()

      return populatedNotif
    } catch (error) {
      // Bọc try-catch để lỗi gửi notification không làm vỡ các flow chính
      console.error('🔥 [notificationService.createNotification] Error:', error.message)
      return null
    }
  }
}
