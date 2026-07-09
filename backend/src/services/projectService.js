import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Project from '../models/projects.js'
import Sprint from '../models/sprints.js'
import Issue from '../models/issues.js'
import ApiError from '../utils/ApiError.js'

// Các enum hợp lệ (khớp với models/projects.js).
const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED']
const PROJECT_METHODOLOGIES = ['SCRUM', 'KANBAN']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Chuẩn hoá key người dùng nhập: chữ hoa, bỏ ký tự không phải chữ/số.
const normalizeKey = (key) => key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

// Không có key -> tự sinh từ tên project (chữ đầu mỗi từ, tối đa 5 ký tự).
const deriveKeyFromName = (name) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 5)

  return initials.length >= 2 ? initials : name.slice(0, 5).toUpperCase()
}

const resolveProjectKey = (key, name) => {
  if (!key || !key.trim()) return deriveKeyFromName(name)

  const normalized = normalizeKey(key)
  if (normalized.length < 2) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Project key phải có ít nhất 2 ký tự chữ/số')
  }
  return normalized
}

// Không có methodology -> mặc định KANBAN (đơn giản nhất, không cần cấu hình Sprint).
const resolveMethodology = (methodology) => {
  if (!methodology) return 'KANBAN'
  if (!PROJECT_METHODOLOGIES.includes(methodology)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid project methodology')
  }
  return methodology
}

// Tạo project. Người tạo trở thành OWNER và là 1 member ACTIVE.
const createProject = async (userId, body = {}) => {
  const { name, description, deadline, key, methodology } = body

  if (!name || !name.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Project name is required')
  }

  const project = await Project.create({
    name: name.trim(),
    key: resolveProjectKey(key, name),
    methodology: resolveMethodology(methodology),
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

  if (body.key !== undefined) {
    payload.key = resolveProjectKey(body.key, body.name ?? '')
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
