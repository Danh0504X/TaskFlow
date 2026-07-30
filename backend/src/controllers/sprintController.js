import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { sprintService } from '../services/sprintService.js'

// Tạo sprint trong project.
export const createSprint = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await sprintService.createSprint(projectId, req.user._id, req.body, req.project)

  res.status(StatusCodes.CREATED).json({
    message: 'Sprint created successfully',
    data: result,
  })
})

// Lấy danh sách sprint theo project.
export const getSprintsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await sprintService.getSprintsByProject(projectId)

  res.status(StatusCodes.OK).json({
    message: 'Get sprints successfully',
    data: result,
  })
})

// Lấy chi tiết 1 sprint.
export const getSprintById = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await sprintService.getSprintById(projectId, sprintId)

  res.status(StatusCodes.OK).json({
    message: 'Get sprint detail successfully',
    data: result,
  })
})

// Cập nhật sprint.
export const updateSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await sprintService.updateSprint(projectId, sprintId, req.body, req.project)

  res.status(StatusCodes.OK).json({
    message: 'Sprint updated successfully',
    data: result,
  })
})

// Xóa sprint (xóa cứng).
export const deleteSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await sprintService.deleteSprint(projectId, sprintId, req.project)

  res.status(StatusCodes.OK).json({
    message: 'Sprint deleted successfully',
    data: result,
  })
})

// Start sprint (chuyển sang ACTIVE).
export const startSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await sprintService.startSprint(projectId, sprintId, req.project, req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'Sprint started successfully',
    data: result,
  })
})

// Complete sprint (chuyển sang COMPLETED). Nếu còn issue chưa DONE, req.body cần
// { resolution, targetSprintId?, newSprint? } để quyết định chuyển chúng đi đâu.
export const completeSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params
  const result = await sprintService.completeSprint(
    projectId,
    sprintId,
    req.project,
    req.user._id,
    req.body,
  )

  res.status(StatusCodes.OK).json({
    message: 'Sprint completed successfully',
    data: result,
  })
})
