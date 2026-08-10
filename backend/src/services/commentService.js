import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Comment from '../models/comments.js'
import Issue from '../models/issues.js'
import User from '../models/users.js'
import Project from '../models/projects.js'
import Notification from '../models/notifications.js'
import ApiError from '../utils/ApiError.js'
import { notificationService } from './notificationService.js'

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

const AUTHOR_POPULATE = { path: 'authorId', select: 'fullName avatarUrl' }

const toCommentDTO = (comment) => {
  const obj = typeof comment.toObject === 'function' ? comment.toObject() : comment

  const author =
    obj.authorId && typeof obj.authorId === 'object'
      ? {
          _id: obj.authorId._id,
          fullName: obj.authorId.fullName,
          avatarUrl: obj.authorId.avatarUrl ?? null,
        }
      : undefined

  return {
    ...obj,
    authorId: author ? author._id.toString() : obj.authorId?.toString(),
    author,
  }
}

const ensureIssueInProject = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOne({
    _id: issueId,
    projectId,
    isDeleted: false,
  }).lean()

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Công việc không tồn tại trong dự án')
  }

  return issue
}

export const commentService = {
  getCommentsByIssue: async (projectId, issueId) => {
    await ensureIssueInProject(projectId, issueId)

    const comments = await Comment.find({
      projectId,
      issueId,
      isDeleted: false,
    })
      .populate(AUTHOR_POPULATE)
      .sort({ createdAt: 1 })
      .lean()

    return comments.map(toCommentDTO)
  },

  createComment: async (projectId, issueId, userId, content) => {
    const issue = await ensureIssueInProject(projectId, issueId)

    const trimmedContent = content?.trim()
    if (!trimmedContent) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Nội dung bình luận không được để trống')
    }

    const now = new Date()
    const created = await Comment.create({
      projectId,
      issueId,
      authorId: userId,
      content: trimmedContent,
      editHistory: [
        {
          content: trimmedContent,
          editedAt: now,
        },
      ],
    })

    // US 3: Tăng đếm số bình luận trên issue
    await Issue.updateOne({ _id: issueId }, { $inc: { commentsCount: 1 } })

    const populated = await Comment.findById(created._id)
      .populate(AUTHOR_POPULATE)
      .lean()

    const actor = await User.findById(userId).select('fullName').lean()
    const actorName = actor ? actor.fullName : 'Ai đó'
    const excerpt = trimmedContent.length > 60 ? `${trimmedContent.slice(0, 60)}...` : trimmedContent

    // US 2: Xử lý @mention (chỉ thành viên ACTIVE trong dự án)
    const project = await Project.findById(projectId).lean()
    const activeMemberUserIds = (project?.members || [])
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.userId.toString())

    const activeUsers = await User.find({ _id: { $in: activeMemberUserIds } })
      .select('_id fullName')
      .lean()

    const mentionedUserIds = new Set()
    for (const u of activeUsers) {
      if (u._id.toString() === userId.toString()) continue // Không nhắc chính mình
      const namePattern = `@${u.fullName}`
      if (
        trimmedContent.toLowerCase().includes(namePattern.toLowerCase()) ||
        trimmedContent.includes(u._id.toString())
      ) {
        mentionedUserIds.add(u._id.toString())
      }
    }

    // US 2 - Yêu cầu 3 & 5: Gửi thông báo MENTIONED cho từng người được nhắc tên
    for (const mentionedId of mentionedUserIds) {
      await notificationService.createNotification({
        userId: mentionedId,
        actorId: userId,
        projectId,
        type: 'MENTIONED',
        entityType: 'ISSUE',
        entityId: issue._id,
        title: 'Bạn được nhắc tên trong bình luận',
        message: `${actorName} đã nhắc đến bạn trong công việc "${issue.title}": "${excerpt}".`,
      })
    }

    // US 1: Gửi thông báo cho người liên quan (Assignee + những người đã comment trước đó)
    const previousCommenters = await Comment.find({
      issueId,
      isDeleted: false,
      authorId: { $ne: userId },
    }).distinct('authorId')

    const relatedRecipients = new Set()
    if (issue.assigneeId && issue.assigneeId.toString() !== userId.toString()) {
      relatedRecipients.add(issue.assigneeId.toString())
    }
    for (const authorIdObj of previousCommenters) {
      const authorIdStr = authorIdObj.toString()
      if (authorIdStr !== userId.toString()) {
        relatedRecipients.add(authorIdStr)
      }
    }

    // Loại trừ những người đã được nhận thông báo MENTIONED (tránh trùng 2 thông báo cho 1 comment)
    for (const mentionedId of mentionedUserIds) {
      relatedRecipients.delete(mentionedId)
    }

    // US 1 - Yêu cầu 5: Gộp thông báo nếu có nhiều bình luận liên tiếp trong thời gian ngắn (5 phút)
    const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000)

    for (const recipientId of relatedRecipients) {
      const recentNotif = await Notification.findOne({
        userId: recipientId,
        entityId: issue._id,
        entityType: 'ISSUE',
        type: 'TASK_COMMENTED',
        isRead: false,
        createdAt: { $gte: FIVE_MINUTES_AGO },
      })

      if (recentNotif) {
        // Gộp thông báo gần nhất thay vì tạo mới
        recentNotif.actorId = userId
        recentNotif.message = `${actorName} và những người khác đã bình luận trong công việc "${issue.title}".`
        recentNotif.updatedAt = new Date()
        await recentNotif.save()
      } else {
        await notificationService.createNotification({
          userId: recipientId,
          actorId: userId,
          projectId,
          type: 'TASK_COMMENTED',
          entityType: 'ISSUE',
          entityId: issue._id,
          title: 'Bình luận mới trên công việc',
          message: `${actorName} đã bình luận trong công việc "${issue.title}": "${excerpt}".`,
        })
      }
    }

    return toCommentDTO(populated)
  },

  updateComment: async (projectId, issueId, commentId, userId, content) => {
    await ensureIssueInProject(projectId, issueId)
    ensureValidObjectId(commentId, 'comment id')

    if (!content || !content.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Nội dung bình luận không được để trống')
    }

    const comment = await Comment.findOne({
      _id: commentId,
      issueId,
      projectId,
      isDeleted: false,
    })

    if (!comment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Bình luận không tồn tại')
    }

    // Yêu cầu 2 & 6: Chỉ người viết mới sửa được bình luận của mình.
    // Thành viên khác (kể cả Project Owner) cố sửa -> từ chối với mã 403.
    if (comment.authorId.toString() !== userId.toString()) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ người viết mới có quyền sửa bình luận này')
    }

    const newContent = content.trim()
    const now = new Date()

    // Lấy danh sách lịch sử hiện tại hoặc tạo mới nếu chưa có
    let history = Array.isArray(comment.editHistory) && comment.editHistory.length > 0
      ? comment.editHistory.map((item) => ({ content: item.content, editedAt: item.editedAt }))
      : [
          {
            content: comment.content,
            editedAt: comment.createdAt || now,
          },
        ]

    history.push({
      content: newContent,
      editedAt: now,
    })

    comment.content = newContent
    comment.isEdited = true
    comment.editedAt = now
    comment.editHistory = history
    comment.markModified('editHistory')
    await comment.save()

    const populated = await Comment.findById(comment._id)
      .populate(AUTHOR_POPULATE)
      .lean()

    return toCommentDTO(populated)
  },

  deleteComment: async (projectId, issueId, commentId, userId, projectRole) => {
    await ensureIssueInProject(projectId, issueId)
    ensureValidObjectId(commentId, 'comment id')

    const comment = await Comment.findOne({
      _id: commentId,
      issueId,
      projectId,
      isDeleted: false,
    })

    if (!comment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Bình luận không tồn tại')
    }

    const isAuthor = comment.authorId.toString() === userId.toString()
    const isProjectOwner = projectRole === 'OWNER'

    // Yêu cầu 2 & 6: Chỉ người viết hoặc chủ sở hữu dự án mới xoá được bình luận.
    // Thành viên khác cố xoá -> từ chối với mã 403.
    if (!isAuthor && !isProjectOwner) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xoá bình luận này')
    }

    // Ràng buộc: Chỉ được xóa trong 1 tiếng kể từ khi comment lần đầu (tính theo createdAt)
    const ONE_HOUR_MS = 60 * 60 * 1000
    const createdTime = new Date(comment.createdAt).getTime()
    if (Date.now() - createdTime > ONE_HOUR_MS) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Bình luận chỉ có thể xóa trong vòng 1 giờ kể từ khi tạo lần đầu',
      )
    }

    comment.isDeleted = true
    comment.deletedAt = new Date()
    await comment.save()

    // US 3: Giảm số đếm bình luận trên issue
    await Issue.updateOne({ _id: issueId, commentsCount: { $gt: 0 } }, { $inc: { commentsCount: -1 } })

    return { _id: commentId, message: 'Đã xoá bình luận thành công' }
  },
}
