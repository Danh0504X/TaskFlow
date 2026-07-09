import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Issue from '../models/issues.js'
import Sprint from '../models/sprints.js'
import ApiError from '../utils/ApiError.js'

// Các enum hợp lệ (khớp với models/issues.js).
const ISSUE_TYPES = ['EPIC', 'TASK', 'SUBTASK', 'BUG']
const ISSUE_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Đảm bảo sprintId thuộc đúng project (và chưa bị xóa mềm).
const ensureSprintInProject = async (projectId, sprintId) => {
  ensureValidObjectId(sprintId, 'sprint id')
  const sprint = await Sprint.findOne({
    _id: sprintId,
    projectId,
    isDeleted: false,
  }).lean()

  if (!sprint) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint does not belong to this project')
  }
}

// Đảm bảo issue cha thuộc đúng project (và chưa bị xóa mềm).
const ensureParentIssueInProject = async (projectId, parentIssueId, currentIssueId = null) => {
  ensureValidObjectId(parentIssueId, 'parent issue id')

  if (currentIssueId && parentIssueId.toString() === currentIssueId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Issue cannot be parent of itself')
  }

  const parent = await Issue.findOne({
    _id: parentIssueId,
    projectId,
    isDeleted: false,
  }).lean()

  if (!parent) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Parent issue does not belong to this project')
  }
}

// Tạo issue trong project.
const createIssue = async (projectId, userId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const {
    title,
    description,
    type,
    status,
    priority,
    sprintId,
    parentIssueId,
    assigneeId,
    orderIndex,
  } = body

  if (!title || !title.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Issue title is required')
  }

  if (type !== undefined && !ISSUE_TYPES.includes(type)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue type')
  }

  if (status !== undefined && !ISSUE_STATUSES.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue status')
  }

  if (priority !== undefined && !ISSUE_PRIORITIES.includes(priority)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue priority')
  }

  if (sprintId) {
    await ensureSprintInProject(projectId, sprintId)
  }

  if (parentIssueId) {
    await ensureParentIssueInProject(projectId, parentIssueId)
  }

  if (assigneeId) {
    ensureValidObjectId(assigneeId, 'assignee id')
  }

  const issue = await Issue.create({
    projectId,
    createdBy: userId,
    title: title.trim(),
    description: description?.trim() || '',
    type: type || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sprintId: sprintId || null,
    parentIssueId: parentIssueId || null,
    assigneeId: assigneeId || null,
    orderIndex: orderIndex ?? 0,
  })

  return issue
}

// Lấy danh sách issue theo project, hỗ trợ filter qua query.
const getIssuesByProject = async (projectId, query = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const filter = { projectId, isDeleted: false }

  if (query.sprintId) {
    ensureValidObjectId(query.sprintId, 'sprint id')
    filter.sprintId = query.sprintId
  }

  if (query.status) {
    if (!ISSUE_STATUSES.includes(query.status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue status')
    }
    filter.status = query.status
  }

  if (query.type) {
    if (!ISSUE_TYPES.includes(query.type)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue type')
    }
    filter.type = query.type
  }

  if (query.priority) {
    if (!ISSUE_PRIORITIES.includes(query.priority)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue priority')
    }
    filter.priority = query.priority
  }

  if (query.assigneeId) {
    ensureValidObjectId(query.assigneeId, 'assignee id')
    filter.assigneeId = query.assigneeId
  }

  return Issue.find(filter).sort({ orderIndex: 1 }).lean()
}

// Lấy danh sách issue theo sprint (đảm bảo sprint thuộc project).
const getIssuesBySprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  await ensureSprintInProject(projectId, sprintId)

  return Issue.find({ projectId, sprintId, isDeleted: false })
    .sort({ orderIndex: 1 })
    .lean()
}

// Lấy chi tiết issue, đảm bảo thuộc đúng project.
const getIssueById = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOne({ _id: issueId, projectId, isDeleted: false })

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  return issue
}

// Cập nhật toàn bộ issue.
const updateIssue = async (projectId, issueId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOne({ _id: issueId, projectId, isDeleted: false })
  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  const payload = {}

  if (body.title !== undefined) {
    if (!body.title || !body.title.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Issue title cannot be empty')
    }
    payload.title = body.title.trim()
  }

  if (body.description !== undefined) {
    payload.description = body.description?.trim() || ''
  }

  if (body.type !== undefined) {
    if (!ISSUE_TYPES.includes(body.type)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue type')
    }
    payload.type = body.type
  }

  if (body.status !== undefined) {
    if (!ISSUE_STATUSES.includes(body.status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue status')
    }
    payload.status = body.status
  }

  if (body.priority !== undefined) {
    if (!ISSUE_PRIORITIES.includes(body.priority)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue priority')
    }
    payload.priority = body.priority
  }

  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      ensureValidObjectId(body.assigneeId, 'assignee id')
      payload.assigneeId = body.assigneeId
    } else {
      payload.assigneeId = null
    }
  }

  if (body.sprintId !== undefined) {
    if (body.sprintId) {
      await ensureSprintInProject(projectId, body.sprintId)
      payload.sprintId = body.sprintId
    } else {
      payload.sprintId = null
    }
  }

  if (body.parentIssueId !== undefined) {
    if (body.parentIssueId) {
      await ensureParentIssueInProject(projectId, body.parentIssueId, issueId)
      payload.parentIssueId = body.parentIssueId
    } else {
      payload.parentIssueId = null
    }
  }

  if (body.orderIndex !== undefined) {
    payload.orderIndex = body.orderIndex
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No valid fields to update')
  }

  Object.assign(issue, payload)
  await issue.save()

  return issue
}

// Cập nhật riêng status của issue (dành cho cả MEMBER).
const updateIssueStatus = async (projectId, issueId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const { status } = body
  if (!status || !ISSUE_STATUSES.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue status')
  }

  const issue = await Issue.findOneAndUpdate(
    { _id: issueId, projectId, isDeleted: false },
    { status },
    { new: true, runValidators: true },
  )

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  return issue
}

// Xóa mềm issue (đồng thời xóa mềm các subtask con).
const deleteIssue = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOneAndUpdate(
    { _id: issueId, projectId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  )

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  // Xóa mềm các issue con (subtask) thuộc issue này.
  await Issue.updateMany(
    { projectId, parentIssueId: issueId, isDeleted: false },
    { isDeleted: true },
  )

  return issue
}

export const issueService = {
  createIssue,
  getIssuesByProject,
  getIssuesBySprint,
  getIssueById,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
}
