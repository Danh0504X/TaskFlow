import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Sprint from '../models/sprints.js'
import ApiError from '../utils/ApiError.js'

// NOTE: Đây mới là KHUNG service.

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Tạo sprint trong project.
const createSprint = async (projectId, userId, body) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Validate body (name, startDate, endDate...).
  // - Tạo Sprint với projectId, createdBy = userId, status mặc định 'PLANNED'.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'createSprint is not implemented yet')
}

// Lấy danh sách sprint của 1 project (chưa xóa mềm).
const getSprintsByProject = async (projectId) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Sprint.find({ projectId, isDeleted: false }).sort({ orderIndex: 1 }).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'getSprintsByProject is not implemented yet')
}

// Lấy chi tiết 1 sprint, đảm bảo thuộc đúng project.
const getSprintById = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - Sprint.findOne({ _id: sprintId, projectId, isDeleted: false }).
  // - Không có -> 404.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'getSprintById is not implemented yet')
}

// Cập nhật sprint.
const updateSprint = async (projectId, sprintId, body) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - Kiểm tra sprint thuộc project.
  // - Chỉ update field cho phép (name, goal, startDate, endDate, orderIndex...).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'updateSprint is not implemented yet')
}

// Xóa mềm sprint.
const deleteSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - Kiểm tra sprint thuộc project.
  // - Set isDeleted: true. (Tùy chọn: gỡ sprintId khỏi các issue liên quan.)
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'deleteSprint is not implemented yet')
}

// Start sprint: mỗi project chỉ 1 sprint ACTIVE tại 1 thời điểm.
const startSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - Kiểm tra sprint thuộc project và đang PLANNED.
  // - Nếu project đã có sprint ACTIVE khác -> 409 Conflict.
  // - Set status = 'ACTIVE'.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'startSprint is not implemented yet')
}

// Complete sprint: chỉ sprint đang ACTIVE mới complete được.
const completeSprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - Kiểm tra sprint thuộc project và đang ACTIVE.
  // - Nếu không ACTIVE -> 400/409.
  // - Set status = 'COMPLETED'.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'completeSprint is not implemented yet')
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
