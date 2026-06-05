import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Project from '../models/projects.js'
import Sprint from '../models/sprints.js'
import Issue from '../models/issues.js'
import ApiError from '../utils/ApiError.js'

// Các status hợp lệ của project (khớp với enum trong models/projects.js).
const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Tạo project. Người tạo trở thành OWNER và là 1 member ACTIVE.
const createProject = async (userId, body = {}) => {
  const { name, description, deadline } = body

  if (!name || !name.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Project name is required')
  }

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim() || '',
    deadline: deadline || null,
    createdBy: userId,
    members: [{ userId, role: 'OWNER', status: 'ACTIVE' }],
  })

  return project
}

// Lấy danh sách project mà user là member (chưa bị xóa mềm).
const getMyProjects = async (userId) => {
  return Project.find({ 'members.userId': userId, isDeleted: false })
    .sort({ updatedAt: -1 })
    .lean()
}

// Lấy chi tiết 1 project.
const getProjectById = async (projectId, userId) => {
  ensureValidObjectId(projectId, 'project id')
  const project = await Project.findOne({ _id: projectId, isDeleted: false })

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  return project
}

// Cập nhật project.

const updateProject = async (projectId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')

  // Chỉ cho phép cập nhật các field này.
  const payload = {}

  if (body.name !== undefined) {
    if (!body.name || !body.name.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Project name cannot be empty')
    }
    payload.name = body.name.trim()
  }

  if (body.description !== undefined) {
    payload.description = body.description?.trim() || ''
  }

  if (body.deadline !== undefined) {
    payload.deadline = body.deadline || null
  }

  if (body.status !== undefined) {
    if (!PROJECT_STATUSES.includes(body.status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid project status')
    }
    payload.status = body.status
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No valid fields to update')
  }

  const project = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    payload,
    { new: true, runValidators: true },
  )

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  return project
}

// Xóa mềm project (đồng thời cascade soft-delete sprint/issue thuộc project).
const deleteProject = async (projectId) => {
  ensureValidObjectId(projectId, 'project id')

  const project = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  )

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  // Cascade soft-delete các sprint và issue thuộc project.
  await Promise.all([
    Sprint.updateMany({ projectId, isDeleted: false }, { isDeleted: true }),
    Issue.updateMany({ projectId, isDeleted: false }, { isDeleted: true }),
  ])

  return project
}

export const projectService = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
}
