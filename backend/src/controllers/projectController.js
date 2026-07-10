import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { projectService } from '../services/projectService.js'

// Tạo project mới. User tạo project sẽ là OWNER.
export const createProject = asyncHandler(async (req, res) => {
  const result = await projectService.createProject(req.user._id, req.body)

  res.status(StatusCodes.CREATED).json({
    message: 'Project created successfully',
    data: result,
  })
})

// Mời (thêm) thành viên vào project bằng email.
export const inviteMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.inviteMembers(projectId, req.user._id, req.body.invites)

  res.status(StatusCodes.OK).json({
    message: 'Invite members processed',
    data: result,
  })
})

// Lấy danh sách project mà user hiện tại tham gia.
export const getMyProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getMyProjects(req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get my projects successfully',
    data: result,
  })
})

// Lấy chi tiết 1 project theo projectId.
export const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.getProjectById(projectId, req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get project detail successfully',
    data: result,
  })
})

// Cập nhật thông tin project.
export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.updateProject(projectId, req.body)

  res.status(StatusCodes.OK).json({
    message: 'Project updated successfully',
    data: result,
  })
})

// Xóa mềm project (isDeleted: true).
export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.deleteProject(projectId)

  res.status(StatusCodes.OK).json({
    message: 'Project deleted successfully',
    data: result,
  })
})
