import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Sprint from '../models/sprints.js'
import Issue from '../models/issues.js'
import ApiError from '../utils/ApiError.js'

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Lấy sprint thuộc đúng project (chưa xóa mềm) hoặc ném 404.
const findSprintInProject = async (projectId, sprintId) => {
  const sprint = await Sprint.findOne({ _id: sprintId, projectId, isDeleted: false })
  if (!sprint) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sprint not found')
  }
  return sprint
}

// Tạo sprint trong project.
const createSprint = async (projectId, userId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const { name, goal, startDate, endDate, orderIndex } = body

  if (!name || !name.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint name is required')
  }

  if (!startDate || !endDate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Start date and end date are required')
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid start date or end date')
  }

  if (end <= start) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'End date must be greater than start date')
  }

  const sprint = await Sprint.create({
    projectId,
    createdBy: userId,
    name: name.trim(),
    goal: goal?.trim() || '',
    startDate: start,
    endDate: end,
    orderIndex: orderIndex ?? 0,
    status: 'PLANNED',
  })

  return sprint
}

// Lấy danh sách sprint của 1 project (chưa xóa mềm).
const getSprintsByProject = async (projectId) => {
  ensureValidObjectId(projectId, 'project id')

  return Sprint.find({ projectId, isDeleted: false }).sort({ orderIndex: 1 }).lean()
}

// Lấy chi tiết 1 sprint, đảm bảo thuộc đúng project.
const getSprintById = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  return findSprintInProject(projectId, sprintId)
}

// Cập nhật sprint.
const updateSprint = async (projectId, sprintId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  const sprint = await findSprintInProject(projectId, sprintId)

  if (body.name !== undefined) {
    if (!body.name || !body.name.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint name cannot be empty')
    }
    sprint.name = body.name.trim()
  }

  if (body.goal !== undefined) {
    sprint.goal = body.goal?.trim() || ''
  }

  if (body.startDate !== undefined) {
    const start = new Date(body.startDate)
    if (Number.isNaN(start.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid start date')
    }
    sprint.startDate = start
  }

  if (body.endDate !== undefined) {
    const end = new Date(body.endDate)
    if (Number.isNaN(end.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid end date')
    }
    sprint.endDate = end
  }

  if (sprint.endDate <= sprint.startDate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'End date must be greater than start date')
  }

  if (body.orderIndex !== undefined) {
    sprint.orderIndex = body.orderIndex
  }

  await sprint.save()
  return sprint
}

// Xóa mềm sprint (đồng thời gỡ sprintId khỏi các issue liên quan).
const deleteSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  const sprint = await findSprintInProject(projectId, sprintId)

  sprint.isDeleted = true
  await sprint.save()

  // Gỡ các issue ra khỏi sprint đã xóa (đưa về backlog).
  await Issue.updateMany(
    { projectId, sprintId, isDeleted: false },
    { sprintId: null },
  )

  return sprint
}

// Start sprint: mỗi project chỉ 1 sprint ACTIVE tại 1 thời điểm.
const startSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  const sprint = await findSprintInProject(projectId, sprintId)

  if (sprint.status !== 'PLANNED') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Only a PLANNED sprint can be started',
    )
  }

  const activeSprint = await Sprint.findOne({
    projectId,
    status: 'ACTIVE',
    isDeleted: false,
  }).lean()

  if (activeSprint) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This project already has an active sprint',
    )
  }

  sprint.status = 'ACTIVE'
  await sprint.save()

  return sprint
}

// Complete sprint: chỉ sprint đang ACTIVE mới complete được.
const completeSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')

  const sprint = await findSprintInProject(projectId, sprintId)

  if (sprint.status !== 'ACTIVE') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Only an ACTIVE sprint can be completed',
    )
  }

  sprint.status = 'COMPLETED'
  await sprint.save()

  return sprint
}

export const sprintService = {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
}
