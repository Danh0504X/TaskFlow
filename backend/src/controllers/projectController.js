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

// Lấy danh sách lời mời tham gia dự án đang chờ user hiện tại xử lý.
export const getMyInvitations = asyncHandler(async (req, res) => {
  const result = await projectService.getMyInvitations(req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get pending invitations successfully',
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

// Lấy danh sách project đã lưu trữ (isDeleted: true) mà user hiện tại là OWNER.
export const getArchivedProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getArchivedProjects(req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Get archived projects successfully',
    data: result,
  })
})

// Khôi phục project đã lưu trữ (isDeleted: true -> false).
export const restoreProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.restoreProject(projectId, req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Project restored successfully',
    data: result,
  })
})

// Xóa vĩnh viễn project (hard delete, không thể hoàn tác).
export const permanentlyDeleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  await projectService.permanentlyDeleteProject(projectId, req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Project permanently deleted',
  })
})

// Rời khỏi dự án.
export const leaveProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await projectService.leaveProject(projectId, req.user._id)

  res.status(StatusCodes.OK).json({
    message: result.message,
    data: result,
  })
})

// Chấp nhận lời mời tham gia dự án.
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const { token } = req.body
  const result = await projectService.acceptInvitation(projectId, req.user._id, token)

  res.status(StatusCodes.OK).json({
    message: 'Joined project successfully',
    data: result,
  })
})

// Từ chối lời mời tham gia dự án.
export const declineInvitation = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const { token } = req.body
  const result = await projectService.declineInvitation(projectId, req.user._id, token)

  res.status(StatusCodes.OK).json({
    message: 'Declined project invitation successfully',
    data: result,
  })
})

// Xóa thành viên khỏi dự án.
export const removeMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params
  const result = await projectService.removeMember(projectId, req.user._id, userId)

  res.status(StatusCodes.OK).json({
    message: 'Removed member successfully',
    data: result,
  })
})

// Chuyển quyền sở hữu dự án cho thành viên khác.
export const transferOwnership = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const { newOwnerId } = req.body
  const result = await projectService.transferOwnership(projectId, req.user._id, newOwnerId)

  res.status(StatusCodes.OK).json({
    message: 'Transferred project ownership successfully',
    data: result,
  })
})



