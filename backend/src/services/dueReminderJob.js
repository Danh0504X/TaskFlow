import Issue from '../models/issues.js'
import Project from '../models/projects.js'
import { notificationService } from './notificationService.js'

export const checkDueIssuesAndNotify = async () => {
  try {
    const now = new Date()
    const NEXT_24_HOURS = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // US 4: Quét định kỳ các issue sắp tới hạn (hoặc quá hạn) chưa DONE, chưa bị xoá, chưa từng nhắc hạn.
    const issues = await Issue.find({
      isDeleted: false,
      status: { $ne: 'DONE' },
      dueRemindedAt: null,
      dueDate: { $ne: null, $lte: NEXT_24_HOURS },
    })
      .populate('projectId')
      .lean()

    for (const issue of issues) {
      const project = issue.projectId
      if (!project || project.isDeleted) continue

      const recipients = new Set()

      // 1. Thêm người phụ trách (assigneeId)
      if (issue.assigneeId) {
        recipients.add(issue.assigneeId.toString())
      }

      // 2. Thêm Chủ sở hữu dự án (project.createdBy hoặc thành viên role OWNER)
      if (project.createdBy) {
        recipients.add(project.createdBy.toString())
      }
      if (Array.isArray(project.members)) {
        for (const member of project.members) {
          if (member.role === 'OWNER' && member.status === 'ACTIVE') {
            recipients.add(member.userId.toString())
          }
        }
      }

      const issueTitle = issue.title
      const projectKey = project.key || 'TASK'

      for (const recipientId of recipients) {
        await notificationService.createNotification({
          userId: recipientId,
          actorId: null, // Thông báo tự động từ hệ thống
          projectId: project._id,
          type: 'TASK_ASSIGNED',
          entityType: 'ISSUE',
          entityId: issue._id,
          title: 'Công việc sắp đến hạn',
          message: `Công việc "${projectKey}-${issue.issueNumber}: ${issueTitle}" sắp đến hạn hoặc đã quá hạn xử lý.`,
        })
      }

      // Đánh dấu đã nhắc mốc này để không bị nhắc lặp lại ở lần quét sau
      await Issue.updateOne({ _id: issue._id }, { dueRemindedAt: new Date() })
    }
  } catch (error) {
    console.error('🔥 [dueReminderJob] Lỗi khi quét công việc sắp đến hạn:', error.message)
  }
}

export const initDueReminderJob = () => {
  // Quét ngay 1 lần khi server khởi động
  checkDueIssuesAndNotify()
  // Thiết lập quét tự động định kỳ mỗi 15 phút
  setInterval(checkDueIssuesAndNotify, 15 * 60 * 1000)
}
