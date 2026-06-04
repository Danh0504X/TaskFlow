import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Issue from '../models/issues.js'
import ApiError from '../utils/ApiError.js'

// NOTE: Đây mới là KHUNG service.

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Tạo issue trong project.
const createIssue = async (projectId, userId, body) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Validate body (title bắt buộc; type/status/priority hợp lệ).
  // - Nếu có sprintId: kiểm tra sprint thuộc cùng projectId.
  // - Nếu có parentIssueId: kiểm tra issue cha thuộc cùng projectId.
  // - Tạo Issue với projectId, createdBy = userId.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'createIssue is not implemented yet')
}

// Lấy danh sách issue theo project, hỗ trợ filter qua query.
const getIssuesByProject = async (projectId, query = {}) => {
  ensureValidObjectId(projectId, 'project id')
  // TODO:
  // - Build filter { projectId, isDeleted: false } + (sprintId/status/type/priority nếu có).
  // - Issue.find(filter).sort({ orderIndex: 1 }).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'getIssuesByProject is not implemented yet')
}

// Lấy danh sách issue theo sprint (đảm bảo sprint thuộc project).
const getIssuesBySprint = async (projectId, sprintId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  // TODO:
  // - (Tùy chọn) kiểm tra sprint thuộc project.
  // - Issue.find({ projectId, sprintId, isDeleted: false }).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'getIssuesBySprint is not implemented yet')
}

// Lấy chi tiết issue, đảm bảo thuộc đúng project.
const getIssueById = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')
  // TODO:
  // - Issue.findOne({ _id: issueId, projectId, isDeleted: false }).
  // - Không có -> 404.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'getIssueById is not implemented yet')
}

// Cập nhật toàn bộ issue.
const updateIssue = async (projectId, issueId, body) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')
  // TODO:
  // - Kiểm tra issue thuộc project.
  // - Nếu đổi sprintId/parentIssueId: kiểm tra cùng project.
  // - Chỉ update field cho phép (title, description, type, priority, assigneeId, sprintId, parentIssueId, status, orderIndex...).
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'updateIssue is not implemented yet')
}

// Cập nhật riêng status của issue (dành cho cả MEMBER).
const updateIssueStatus = async (projectId, issueId, body) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')
  // TODO:
  // - Validate body.status thuộc ['TODO','IN_PROGRESS','IN_REVIEW','DONE'].
  // - Kiểm tra issue thuộc project, set status mới.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'updateIssueStatus is not implemented yet')
}

// Xóa mềm issue.
const deleteIssue = async (projectId, issueId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(issueId, 'issue id')
  // TODO:
  // - Kiểm tra issue thuộc project, set isDeleted: true.
  // - (Tùy chọn) xử lý các subtask con.
  throw new ApiError(StatusCodes.NOT_IMPLEMENTED, 'deleteIssue is not implemented yet')
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
