import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Issue from '../models/issues.js'
import Sprint from '../models/sprints.js'
import Project from '../models/projects.js'
import ApiError from '../utils/ApiError.js'

// Các enum hợp lệ (khớp với models/issues.js).
const ISSUE_TYPES = ['EPIC', 'TASK', 'SUBTASK', 'BUG']
const ISSUE_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

// Field populate dùng chung để trả assignee/epic dạng object thay vì ObjectId thô.
const ASSIGNEE_POPULATE = { path: 'assigneeId', select: 'fullName avatarUrl' }
const PARENT_ISSUE_POPULATE = { path: 'parentIssueId', select: 'title type' }

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Chuẩn hoá issue trả về cho client: sinh mã "key" (PROJ-12) từ project.key +
// issueNumber, và quy các ObjectId đã populate (assigneeId/parentIssueId) về
// dạng object gọn (assignee/epicName) mà frontend cần.
const toIssueDTO = (issue, projectKey) => {
  const obj = typeof issue.toObject === 'function' ? issue.toObject() : issue

  const assignee = obj.assigneeId && typeof obj.assigneeId === 'object'
    ? {
        _id: obj.assigneeId._id,
        fullName: obj.assigneeId.fullName,
        avatarUrl: obj.assigneeId.avatarUrl ?? null,
      }
    : undefined

  const epicName = obj.parentIssueId && typeof obj.parentIssueId === 'object'
    ? obj.parentIssueId.title
    : undefined

  return {
    ...obj,
    key: `${projectKey}-${obj.issueNumber}`,
    assigneeId: assignee ? assignee._id : obj.assigneeId,
    assignee,
    epicName,
  }
}

// Đảm bảo sprintId thuộc đúng project, chưa bị xóa mềm, và đang ở trạng thái còn "sống"
// (PLANNED/ACTIVE) — không cho gán issue vào 1 sprint đã COMPLETED/CANCELLED.
const ensureSprintInProject = async (projectId, sprintId) => {
  ensureValidObjectId(sprintId, 'sprint id')
  const sprint = await Sprint.findOne({
    _id: sprintId,
    projectId,
    isDeleted: false,
    status: { $in: ['PLANNED', 'ACTIVE'] },
  }).lean()

  if (!sprint) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Sprint does not belong to this project or is no longer open (must be PLANNED or ACTIVE)',
    )
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

// Board chỉ "mở" (cho đổi status) với: project KANBAN (luôn tự do), hoặc project SCRUM
// khi issue đang thuộc 1 sprint đang ACTIVE. Đây là chốt chặn thật ở backend cho việc
// "khóa board khi không có sprint đang chạy" — trước đây chỉ là ý tưởng UI, không có ở BE.
const ensureIssueStatusChangeAllowed = async (project, issue) => {
  if (!project || project.methodology !== 'SCRUM') return

  if (!issue.sprintId) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Issue đang ở Backlog — cần đưa vào sprint đang chạy trước khi đổi trạng thái',
    )
  }

  const sprint = await Sprint.findOne({ _id: issue.sprintId, isDeleted: false }).lean()
  if (!sprint || sprint.status !== 'ACTIVE') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Board đang khóa vì dự án không có sprint nào đang chạy',
    )
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

// Không gửi sprintId -> issue vào Backlog (mặc định, phù hợp cả Scrum lẫn Kanban).
  // Có gửi sprintId -> tạo thẳng vào sprint đó, miễn là sprint thuộc đúng project và còn
  // "mở" (PLANNED/ACTIVE) — dùng cho quick-add ngay trong 1 sprint cụ thể (Backlog) hoặc
  // trực tiếp trên Board (sprint đang ACTIVE). Không tự suy luận sprint nếu client không
  // truyền rõ id — tránh gán nhầm vào sprint không mong muốn.
  if (sprintId) {
    await ensureSprintInProject(projectId, sprintId)
  }

  if (parentIssueId) {
    await ensureParentIssueInProject(projectId, parentIssueId)
  }

  if (assigneeId) {
    ensureValidObjectId(assigneeId, 'assignee id')
  }

  // Tăng nguyên tử bộ đếm issue của project -> dùng làm issueNumber, tránh đụng
  // số thứ tự khi nhiều issue được tạo đồng thời.
  const updatedProject = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    { $inc: { issueSeq: 1 } },
    { new: true },
  )
  if (!updatedProject) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const issue = await Issue.create({
    projectId,
    createdBy: userId,
    issueNumber: updatedProject.issueSeq,
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

  await issue.populate([ASSIGNEE_POPULATE, PARENT_ISSUE_POPULATE])

  return toIssueDTO(issue, updatedProject.key)
}

// Lấy danh sách issue theo project, hỗ trợ filter qua query.
const getIssuesByProject = async (projectId, query = {}, projectKey) => {
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

  const issues = await Issue.find(filter)
    .sort({ orderIndex: 1 })
    .populate(ASSIGNEE_POPULATE)
    .populate(PARENT_ISSUE_POPULATE)
    .lean()

  return issues.map((issue) => toIssueDTO(issue, projectKey))
}

// Lấy danh sách issue theo sprint (đảm bảo sprint thuộc project).
const getIssuesBySprint = async (projectId, sprintId, projectKey) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  const sprint = await Sprint.findOne({ _id: sprintId, projectId, isDeleted: false }).lean()
  if (!sprint) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint does not belong to this project')
  }

  const issues = await Issue.find({ projectId, sprintId, isDeleted: false })
    .sort({ orderIndex: 1 })
    .populate(ASSIGNEE_POPULATE)
    .populate(PARENT_ISSUE_POPULATE)
    .lean()

  return issues.map((issue) => toIssueDTO(issue, projectKey))
}

// Lấy chi tiết issue, đảm bảo thuộc đúng project.
const getIssueById = async (projectId, issueId, projectKey) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOne({ _id: issueId, projectId, isDeleted: false })
    .populate(ASSIGNEE_POPULATE)
    .populate(PARENT_ISSUE_POPULATE)

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  return toIssueDTO(issue, projectKey)
}

// Cập nhật toàn bộ issue.
const updateIssue = async (projectId, issueId, body = {}, projectKey, project) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOne({ _id: issueId, projectId, isDeleted: false })
  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  if (body.status !== undefined) {
    await ensureIssueStatusChangeAllowed(project, issue)
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
  await issue.populate([ASSIGNEE_POPULATE, PARENT_ISSUE_POPULATE])

  return toIssueDTO(issue, projectKey)
}

// Cập nhật riêng status của issue (dành cho cả MEMBER) — cũng là endpoint chính cho
// kéo-thả trên Board/Backlog nên nhận thêm `orderIndex` (optional) để 1 lần gọi xử lý
// được cả đổi cột lẫn đổi vị trí, không cần rơi về PUT (OWNER-only) chỉ vì orderIndex.
const updateIssueStatus = async (projectId, issueId, body = {}, projectKey, project) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const { status, orderIndex } = body
  if (!status || !ISSUE_STATUSES.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid issue status')
  }

  const issue = await Issue.findOne({ _id: issueId, projectId, isDeleted: false })
  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  await ensureIssueStatusChangeAllowed(project, issue)

  const update = { status }
  if (orderIndex !== undefined) {
    update.orderIndex = orderIndex
  }

  issue.set(update)
  await issue.save()
  await issue.populate([ASSIGNEE_POPULATE, PARENT_ISSUE_POPULATE])

  return toIssueDTO(issue, projectKey)
}

// Xóa cứng issue (đồng thời xóa cứng các subtask con).
// Lưu ý: đây là xóa riêng lẻ 1 issue qua UI — khác với cascade xóa mềm issue khi cả
// project bị archive (xem projectService.deleteProject), vẫn giữ nguyên isDeleted/deletedAt.
const deleteIssue = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')

  const issue = await Issue.findOneAndDelete({ _id: issueId, projectId, isDeleted: false })

  if (!issue) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')
  }

  // Xóa cứng các issue con (subtask) thuộc issue này.
  await Issue.deleteMany({ projectId, parentIssueId: issueId, isDeleted: false })

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
