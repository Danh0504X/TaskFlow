import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Comment from '../models/comments.js'
import Issue from '../models/issues.js'
import User from '../models/users.js'
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

    if (!content || !content.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Nội dung bình luận không được để trống')
    }

    const created = await Comment.create({
      projectId,
      issueId,
      authorId: userId,
      content: content.trim(),
    })

    const populated = await Comment.findById(created._id)
      .populate(AUTHOR_POPULATE)
      .lean()

    // Gửi thông báo nếu công việc được gán cho người khác
    if (issue.assigneeId && issue.assigneeId.toString() !== userId.toString()) {
      const actor = await User.findById(userId).select('fullName').lean()
      const actorName = actor ? actor.fullName : 'Ai đó'

      await notificationService.createNotification({
        userId: issue.assigneeId,
        actorId: userId,
        projectId,
        type: 'TASK_COMMENTED',
        entityType: 'ISSUE',
        entityId: issue._id,
        title: 'Bình luận mới trên công việc',
        message: `${actorName} đã bình luận trên công việc "${issue.title}".`,
      })
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

    comment.content = content.trim()
    comment.isEdited = true
    comment.editedAt = new Date()
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

    comment.isDeleted = true
    comment.deletedAt = new Date()
    await comment.save()

    return { _id: commentId, message: 'Đã xoá bình luận thành công' }
  },
}
