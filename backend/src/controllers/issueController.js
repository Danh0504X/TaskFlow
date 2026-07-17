import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { issueService } from '../services/issueService.js'

// Tạo issue trong project.
export const createIssue = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await issueService.createIssue(projectId, req.user._id, req.body, req.project)

  res.status(StatusCodes.CREATED).json({
    message: 'Issue created successfully',
    data: result,
  })
})

// Lấy danh sách issue theo project (có thể lọc qua query: ?sprintId=&status=&type=).
export const getIssuesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await issueService.getIssuesByProject(projectId, req.query, req.project.key)

  res.status(StatusCodes.OK).json({
    message: 'Get issues successfully',
    data: result,
  })
})

// Lấy danh sách issue theo sprint.
export const getIssuesBySprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await issueService.getIssuesBySprint(projectId, sprintId, req.project.key)

  res.status(StatusCodes.OK).json({
    message: 'Get issues by sprint successfully',
    data: result,
  })
})

// Lấy chi tiết 1 issue.
export const getIssueById = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const result = await issueService.getIssueById(projectId, issueId, req.project.key)

  res.status(StatusCodes.OK).json({
    message: 'Get issue detail successfully',
    data: result,
  })
})

// Cập nhật toàn bộ issue.
export const updateIssue = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const result = await issueService.updateIssue(projectId, issueId, req.body, req.project.key, req.project)

  res.status(StatusCodes.OK).json({
    message: 'Issue updated successfully',
    data: result,
  })
})

// Cập nhật riêng status của issue.
export const updateIssueStatus = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const result = await issueService.updateIssueStatus(projectId, issueId, req.body, req.project.key, req.project)

  res.status(StatusCodes.OK).json({
    message: 'Issue status updated successfully',
    data: result,
  })
})

// Xóa mềm issue.
export const deleteIssue = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params
  const result = await issueService.deleteIssue(projectId, issueId)

  res.status(StatusCodes.OK).json({
    message: 'Issue deleted successfully',
    data: result,
  })
})
