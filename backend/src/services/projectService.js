import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Project from '../models/projects.js'
import ApiError from '../utils/ApiError.js'

// NOTE: Đây mới là KHUNG service. 
// Logic thật sự sẽ được hiện thực sau.

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Tạo project. Người tạo trở thành OWNER và là 1 member ACTIVE.
const createProject = async (userId, body) => {
  // TODO:
  // - Validate body (name bắt buộc).
  // - Tạo project với createdBy = userId.
  // - members = [{ userId, role: 'OWNER', status: 'ACTIVE' }].
  // - return project vừa tạo.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'createProject is not implemented yet')
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

const updateProject = async (projectId, body) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Chỉ cho update các field cho phép (name, description, deadline, status...).
  // - Project.findOneAndUpdate({ _id, isDeleted: false }, payload, { new: true }).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'updateProject is not implemented yet')
}

// Xóa mềm project.
const deleteProject = async (projectId) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Project.findOneAndUpdate({ _id, isDeleted: false }, { isDeleted: true }).
  // - (Tùy chọn) cascade soft-delete các sprint/issue thuộc project.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'deleteProject is not implemented yet')
}

export const projectService = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
}
