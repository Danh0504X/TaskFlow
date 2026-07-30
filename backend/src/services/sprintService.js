import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Sprint from '../models/sprints.js'
import Issue from '../models/issues.js'
import Project from '../models/projects.js'
import ApiError from '../utils/ApiError.js'
import User from '../models/users.js'
import { notificationService } from './notificationService.js'

const RESOLUTIONS = ['BACKLOG', 'MOVE_TO_SPRINT', 'NEW_SPRINT']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

// Sprint chỉ tồn tại có ý nghĩa với project SCRUM -> mọi thao tác ghi (create/update/
// delete/start/complete) đều phải chặn ở đây, kể cả khi ai đó bypass FE và gọi thẳng API.
const ensureScrumProject = (project) => {
  if (!project || project.methodology !== 'SCRUM') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Chức năng sprint chỉ áp dụng cho dự án Scrum',
    )
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

// Gỡ toàn bộ issue (chưa xóa mềm) ra khỏi 1 sprint, đưa về Backlog (sprintId = null).
// KHÔNG đụng tới `status` — dùng chung cho deleteSprint và nhánh BACKLOG của completeSprint.
const moveIssuesToBacklog = async (projectId, sprintId, options = {}) => {
  await Issue.updateMany(
    { projectId, sprintId, isDeleted: false },
    { sprintId: null },
    options,
  )
}

// Tạo sprint trong project. `options` (vd { session }) cho phép completeSprint tái sử
// dụng hàm này khi tạo sprint mới trong nhánh NEW_SPRINT, có thể trong 1 transaction.
const createSprint = async (projectId, userId, body = {}, project, options = {}) => {
  ensureValidObjectId(projectId, 'project id')
  ensureScrumProject(project)

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

  const [sprint] = await Sprint.create(
    [
      {
        projectId,
        createdBy: userId,
        name: name.trim(),
        goal: goal?.trim() || '',
        startDate: start,
        endDate: end,
        orderIndex: orderIndex ?? 0,
        status: 'PLANNED',
      },
    ],
    options,
  )

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

// Cập nhật sprint. Quy tắc sửa theo trạng thái (giống Jira):
// - PLANNED: sửa tự do name/goal/startDate/endDate.
// - ACTIVE: sửa được name/goal/endDate, KHÔNG sửa được startDate (đã bắt đầu).
// - COMPLETED/CANCELLED: không cho sửa gì (chỉ xem, phục vụ lịch sử/báo cáo).
const updateSprint = async (projectId, sprintId, body = {}, project) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  ensureScrumProject(project)

  const sprint = await findSprintInProject(projectId, sprintId)

  if (sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED') {
    throw new ApiError(StatusCodes.CONFLICT, 'Sprint đã kết thúc, không thể chỉnh sửa')
  }

  if (body.startDate !== undefined && sprint.status === 'ACTIVE') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Không thể đổi ngày bắt đầu của sprint đang chạy',
    )
  }

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

// Xóa cứng sprint (đồng thời gỡ sprintId khỏi các issue liên quan, đưa về backlog).
// Không cho xóa sprint đang ACTIVE -> phải complete (hoặc cancel) trước.
// Lưu ý: đây là xóa riêng lẻ 1 sprint qua UI — khác với cascade xóa mềm sprint khi cả
// project bị archive (xem projectService.deleteProject), vẫn giữ nguyên isDeleted/deletedAt.
const deleteSprint = async (projectId, sprintId, project) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  ensureScrumProject(project)

  const sprint = await findSprintInProject(projectId, sprintId)

  if (sprint.status === 'ACTIVE') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Không thể xóa sprint đang chạy, hãy hoàn thành sprint trước',
    )
  }

  await moveIssuesToBacklog(projectId, sprintId)

  await Sprint.deleteOne({ _id: sprintId })

  return sprint
}

// Start sprint: mỗi project chỉ 1 sprint ACTIVE tại 1 thời điểm.
const startSprint = async (projectId, sprintId, project, userId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  ensureScrumProject(project)

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

  try {
    await sprint.save()
  } catch (err) {
    // Phòng hờ race-condition lọt qua check phía trên (2 request start cùng lúc):
    // unique partial index ở tầng DB (models/sprints.js) sẽ chặn bằng lỗi E11000.
    if (err?.code === 11000) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'This project already has an active sprint',
      )
    }
    throw err
  }

  // Gửi thông báo cho các thành viên trong dự án
  if (userId && project.members) {
    const actor = await User.findById(userId).select('fullName').lean()
    const actorName = actor ? actor.fullName : 'Ai đó'
    const activeMembers = project.members.filter(
      (m) => m.status === 'ACTIVE' && m.userId.toString() !== userId.toString()
    )

    for (const member of activeMembers) {
      await notificationService.createNotification({
        userId: member.userId,
        actorId: userId,
        projectId,
        type: 'SPRINT_STARTED',
        entityType: 'SPRINT',
        entityId: sprint._id,
        title: 'Sprint mới bắt đầu',
        message: `${actorName} đã bắt đầu Sprint "${sprint.name}" trong dự án "${project.name}".`,
      })
    }
  }

  return sprint
}

// Complete sprint: chỉ sprint đang ACTIVE mới complete được.
// Nếu còn issue chưa DONE, bắt buộc `resolution` (BACKLOG | MOVE_TO_SPRINT | NEW_SPRINT)
// để quyết định chuyển chúng đi đâu — CHỈ đổi sprintId, KHÔNG bao giờ đổi status (Jira-style).
// Issue đã DONE giữ nguyên sprintId trỏ về sprint vừa COMPLETED (phục vụ velocity sau này).
const completeSprint = async (projectId, sprintId, project, userId, body = {}) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(sprintId, 'sprint id')
  ensureScrumProject(project)

  const sprint = await findSprintInProject(projectId, sprintId)

  if (sprint.status !== 'ACTIVE') {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Only an ACTIVE sprint can be completed',
    )
  }

  const incompleteIssues = await Issue.find({
    projectId,
    sprintId,
    status: { $ne: 'DONE' },
    isDeleted: false,
  }).select('_id').lean()

  const { resolution, targetSprintId, newSprint } = body

  if (incompleteIssues.length > 0 && !RESOLUTIONS.includes(resolution)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cần chọn cách xử lý các task chưa hoàn thành (resolution: BACKLOG | MOVE_TO_SPRINT | NEW_SPRINT)',
    )
  }

  if (incompleteIssues.length > 0 && resolution === 'MOVE_TO_SPRINT') {
    ensureValidObjectId(targetSprintId, 'target sprint id')
    if (targetSprintId === sprintId.toString()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint đích không được trùng sprint đang hoàn thành')
    }
    const targetSprint = await Sprint.findOne({
      _id: targetSprintId,
      projectId,
      status: 'PLANNED',
      isDeleted: false,
    }).lean()
    if (!targetSprint) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Sprint đích không hợp lệ (phải là sprint PLANNED thuộc cùng dự án)')
    }
  }

  if (incompleteIssues.length > 0 && resolution === 'NEW_SPRINT') {
    if (!newSprint?.name || !newSprint?.startDate || !newSprint?.endDate) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin sprint mới (name/startDate/endDate)')
    }
  }

  let createdSprint = null

  // Chuyển issue dở dang theo resolution đã chọn.
  const moveIssues = async (options) => {
    if (incompleteIssues.length === 0) return

    if (resolution === 'BACKLOG') {
      await moveIssuesToBacklog(projectId, sprintId, options)
    } else if (resolution === 'MOVE_TO_SPRINT') {
      await Issue.updateMany(
        { projectId, sprintId, status: { $ne: 'DONE' }, isDeleted: false },
        { sprintId: targetSprintId },
        options,
      )
    } else if (resolution === 'NEW_SPRINT') {
      createdSprint = await createSprint(projectId, userId, newSprint, project, options)
      await Issue.updateMany(
        { projectId, sprintId, status: { $ne: 'DONE' }, isDeleted: false },
        { sprintId: createdSprint._id },
        options,
      )
    }
  }

  // MongoDB Atlas luôn chạy dạng replica set nên transaction luôn khả dụng: move issue
  // + đóng sprint được gộp thành 1 giao dịch atomic, lỗi giữa chừng thì rollback toàn bộ.
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await moveIssues({ session })
      sprint.status = 'COMPLETED'
      await sprint.save({ session })
    })
  } finally {
    session.endSession()
  }

  // Gửi thông báo cho các thành viên trong dự án
  if (userId && project.members) {
    const actor = await User.findById(userId).select('fullName').lean()
    const actorName = actor ? actor.fullName : 'Ai đó'
    const activeMembers = project.members.filter(
      (m) => m.status === 'ACTIVE' && m.userId.toString() !== userId.toString()
    )

    for (const member of activeMembers) {
      await notificationService.createNotification({
        userId: member.userId,
        actorId: userId,
        projectId,
        type: 'SPRINT_COMPLETED',
        entityType: 'SPRINT',
        entityId: sprint._id,
        title: 'Sprint đã hoàn thành',
        message: `${actorName} đã đóng (hoàn thành) Sprint "${sprint.name}".`,
      })
    }
  }

  return { sprint, movedCount: incompleteIssues.length, newSprint: createdSprint }
}

// Lấy các sprint đang ACTIVE, sắp hết hạn nhất trước, trải trên mọi project mà user đang
// là thành viên (dùng cho widget "Sprint sắp kết thúc" ở Dashboard).
const getUpcomingSprints = async (userId, limit = 20) => {
  ensureValidObjectId(userId, 'user id')

  const myProjects = await Project.find({
    isDeleted: false,
    members: { $elemMatch: { userId, status: 'ACTIVE' } },
  })
    .select('_id name')
    .lean()

  if (myProjects.length === 0) return []

  const projectNameById = new Map(myProjects.map((p) => [p._id.toString(), p.name]))

  const sprints = await Sprint.find({
    projectId: { $in: myProjects.map((p) => p._id) },
    status: 'ACTIVE',
    isDeleted: false,
  })
    .sort({ endDate: 1 })
    .limit(limit)
    .lean()

  return sprints.map((sprint) => ({
    ...sprint,
    projectName: projectNameById.get(sprint.projectId.toString()),
  }))
}

export const sprintService = {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getUpcomingSprints,
}
