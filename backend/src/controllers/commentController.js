import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { commentService } from '../services/commentService.js'

export const getComments = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const result = await commentService.getCommentsByIssue(projectId, issueId)

  res.status(StatusCodes.OK).json({
    message: 'Get comments successfully',
    data: result,
  })
})

export const createComment = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const { content } = req.body
  const result = await commentService.createComment(projectId, issueId, req.user._id, content)

  res.status(StatusCodes.CREATED).json({
    message: 'Comment created successfully',
    data: result,
  })
})

export const updateComment = asyncHandler(async (req, res) => {
  const { projectId, issueId, commentId } = req.params
  const { content } = req.body
  const result = await commentService.updateComment(
    projectId,
    issueId,
    commentId,
    req.user._id,
    content,
  )

  res.status(StatusCodes.OK).json({
    message: 'Comment updated successfully',
    data: result,
  })
})

export const deleteComment = asyncHandler(async (req, res) => {
  const { projectId, issueId, commentId } = req.params
  const result = await commentService.deleteComment(
    projectId,
    issueId,
    commentId,
    req.user._id,
    req.projectRole,
  )

  res.status(StatusCodes.OK).json({
    message: 'Comment deleted successfully',
    data: result,
  })
})
