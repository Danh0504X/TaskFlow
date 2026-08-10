import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import Project from '../models/projects.js'
import Sprint from '../models/sprints.js'
import Issue from '../models/issues.js'
import User from '../models/users.js'
import ApiError from '../utils/ApiError.js'
import { env } from '../config/environment.js'
import { EMAIL_PURPOSE, EMAIL_REGEX } from '../utils/constants.js'
import { emailService } from './email/emailService.js'
import { JwtProvider } from '../providers/JwtProvider.js'
import { notificationService } from './notificationService.js'

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

// Chuẩn hoá project trả về cho client sau khi đã populate `members.userId`: giữ `userId`
// là string thô (để mọi so sánh `member.userId === currentUserId` ở FE không bị vỡ), đồng
// thời thêm field `user` chứa thông tin đã populate (fullName/avatarUrl) cho FE hiển thị/chọn
// thành viên (vd assignee picker) — cùng pattern với `assignee`/`assigneeId` ở toIssueDTO.
const toProjectDTO = (project) => {
  const obj = typeof project.toObject === 'function' ? project.toObject() : project

  return {
    ...obj,
    members: obj.members.map((member) => {
      const populatedUser = member.userId && typeof member.userId === 'object' ? member.userId : null

      return {
        ...member,
        userId: populatedUser ? populatedUser._id : member.userId,
        user: populatedUser
          ? { _id: populatedUser._id, fullName: populatedUser.fullName, avatarUrl: populatedUser.avatarUrl ?? null }
          : undefined,
      }
    }),
  }
}

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

// Mời (thêm) nhiều thành viên vào project bằng email. Chỉ chấp nhận email đã có
// tài khoản trong hệ thống; thành viên được thêm ACTIVE ngay (không qua bước
// chấp nhận lời mời riêng) và nhận email thông báo. Mỗi invite xử lý độc lập ->
// 1 email lỗi (không tồn tại/đã là thành viên) không làm hỏng các invite còn lại.
const inviteMembers = async (projectId, inviterId, invites = []) => {
  ensureValidObjectId(projectId, 'project id')

  if (!Array.isArray(invites) || invites.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách mời không được để trống')
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const inviter = await User.findById(inviterId).select('fullName').lean()

  const results = []

  for (const invite of invites) {
    const email = invite?.email?.trim().toLowerCase()

    if (!email || !EMAIL_REGEX.test(email)) {
      results.push({ email: invite?.email ?? '', status: 'FAILED', reason: 'Email không hợp lệ' })
      continue
    }

    const user = await User.findOne({ email }).select('fullName').lean()
    if (!user) {
      // Thành viên chưa có tài khoản -> Đánh dấu là ADDED_NEW để gửi link đăng ký
      results.push({ email, status: 'ADDED_NEW' })
      continue
    }

    const existingMember = project.members.find(
      (member) => member.userId.toString() === user._id.toString(),
    )

    if (existingMember && existingMember.status === 'ACTIVE') {
      results.push({ email, status: 'FAILED', reason: 'Người dùng đã là thành viên của project' })
      continue
    }

    if (existingMember) {
      existingMember.role = 'MEMBER'
      existingMember.status = 'PENDING'
      existingMember.joinedAt = new Date()
    } else {
      project.members.push({ userId: user._id, role: 'MEMBER', status: 'PENDING' })
    }

    results.push({ email, status: 'ADDED', userId: user._id.toString(), fullName: user.fullName })
  }

  await project.save()

  // Gửi email thông báo cho các thành viên
  await Promise.all(
    results
      .filter((result) => result.status === 'ADDED' || result.status === 'ADDED_NEW')
      .map(async (result) => {
        try {
          if (result.status === 'ADDED') {
            const inviteToken = await JwtProvider.generateToken(
              { projectId: project._id.toString(), userId: result.userId, email: result.email },
              env.ACCESS_TOKEN_SECRET,
              '7d',
            )
            await emailService.sendEmailByTemplate({
              to: result.email,
              template: EMAIL_PURPOSE.PROJECT_INVITE,
              data: {
                inviterName: inviter?.fullName,
                projectName: project.name,
                projectUrl: `${env.FRONTEND_URL}/projects/${project._id}/invitation?token=${inviteToken}`,
              },
            })
            // Gửi thông báo trong hệ thống
            await notificationService.createNotification({
              userId: result.userId,
              actorId: inviterId,
              projectId: project._id,
              type: 'INVITATION',
              entityType: 'PROJECT',
              entityId: project._id,
              title: 'Lời mời tham gia dự án',
              message: `${inviter?.fullName || 'Ai đó'} đã mời bạn tham gia vào dự án "${project.name}".`,
            })
          } else {
            // Chưa có tài khoản -> Gửi link đăng ký kèm token mời
            const inviteToken = await JwtProvider.generateToken(
              { projectId: project._id.toString(), email: result.email },
              env.ACCESS_TOKEN_SECRET,
              '7d',
            )
            await emailService.sendEmailByTemplate({
              to: result.email,
              template: EMAIL_PURPOSE.PROJECT_INVITE,
              data: {
                inviterName: inviter?.fullName,
                projectName: project.name,
                projectUrl: `${env.FRONTEND_URL}/register?token=${inviteToken}`,
              },
            })
          }
        } catch (error) {
          console.error('🔥 Gửi email mời thành viên thất bại:', error.message)
        }
      }),
  )

  return {
    added: results.filter((result) => result.status === 'ADDED' || result.status === 'ADDED_NEW'),
    skipped: results.filter((result) => result.status === 'FAILED'),
  }
}

// Lấy danh sách project mà user là member ACTIVE (đã chấp nhận lời mời, chưa rời đi).
// Project mà user còn PENDING (chưa chấp nhận) không xuất hiện ở đây -> xem getMyInvitations.
const getMyProjects = async (userId) => {
  return Project.find({
    members: { $elemMatch: { userId, status: 'ACTIVE' } },
    isDeleted: false,
  })
    .sort({ updatedAt: -1 })
    .lean()
}

// Lấy danh sách lời mời tham gia dự án đang chờ user hiện tại xử lý (status PENDING).
const getMyInvitations = async (userId) => {
  const projects = await Project.find({
    isDeleted: false,
    members: { $elemMatch: { userId, status: 'PENDING' } },
  })
    .select('name key methodology members createdBy')
    .populate({ path: 'createdBy', select: 'fullName avatarUrl' })
    .sort({ updatedAt: -1 })
    .lean()

  return projects.map((project) => {
    const member = project.members.find((m) => m.userId.toString() === userId.toString())

    return {
      projectId: project._id,
      name: project.name,
      key: project.key,
      methodology: project.methodology,
      invitedBy: project.createdBy
        ? { fullName: project.createdBy.fullName, avatarUrl: project.createdBy.avatarUrl ?? null }
        : null,
      invitedAt: member.joinedAt,
    }
  })
}

// Lấy chi tiết 1 project. Populate `members.userId` (fullName/avatarUrl) -> frontend dùng
// trực tiếp để hiển thị/chọn thành viên (vd assignee picker) mà không cần gọi API riêng.
const getProjectById = async (projectId, userId) => {
  ensureValidObjectId(projectId, 'project id')
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .populate({ path: 'members.userId', select: 'fullName avatarUrl' })

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  return toProjectDTO(project)
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

// Kiểm tra userId có phải OWNER (member ACTIVE) của project hay không.
// Dùng cho các API restore/permanent-delete vì project lúc đó thường đã isDeleted:true
// nên không thể tái sử dụng middleware `authorizeProjectRole` (middleware đó luôn lọc
// isDeleted:false trước khi tìm project).
const ensureIsOwner = (project, userId) => {
  const member = project.members.find(
    (m) => m.userId.toString() === userId.toString() && m.status === 'ACTIVE',
  )

  if (!member || member.role !== 'OWNER') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the project owner can perform this action')
  }
}

// Xóa mềm project (đồng thời cascade soft-delete sprint/issue thuộc project).
// Ghi cùng 1 mốc `deletedAt` cho project và các sprint/issue bị cascade -> dùng để khôi phục
// đúng nhóm này sau này, không đụng tới sprint/issue người dùng đã tự xóa từ trước.
const deleteProject = async (projectId) => {
  ensureValidObjectId(projectId, 'project id')

  const deletedAt = new Date()

  const project = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    { isDeleted: true, deletedAt },
    { new: true },
  )

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  // Cascade soft-delete các sprint và issue thuộc project.
  await Promise.all([
    Sprint.updateMany({ projectId, isDeleted: false }, { isDeleted: true, deletedAt }),
    Issue.updateMany({ projectId, isDeleted: false }, { isDeleted: true, deletedAt }),
  ])

  return project
}

// Khôi phục project đã lưu trữ (isDeleted: true -> false). Chỉ OWNER được thực hiện.
// Cascade khôi phục các sprint/issue có cùng `deletedAt` với project (tức bị xóa cùng lượt
// cascade lúc archive) — sprint/issue người dùng tự xóa riêng trước đó (deletedAt khác) giữ nguyên.
const restoreProject = async (projectId, userId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(userId, 'user id')

  const project = await Project.findOne({ _id: projectId, isDeleted: true })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Archived project not found')
  }

  ensureIsOwner(project, userId)

  const deletedAt = project.deletedAt

  project.isDeleted = false
  project.deletedAt = null
  await project.save()

  if (deletedAt) {
    await Promise.all([
      Sprint.updateMany({ projectId, isDeleted: true, deletedAt }, { isDeleted: false, deletedAt: null }),
      Issue.updateMany({ projectId, isDeleted: true, deletedAt }, { isDeleted: false, deletedAt: null }),
    ])
  }

  return project
}

// Xóa vĩnh viễn (hard delete) project khỏi database, cùng toàn bộ sprint/issue thuộc project
// (kể cả sprint/issue đã bị xóa mềm riêng lẻ trước đó). Chỉ OWNER được thực hiện. Không thể hoàn tác.
const permanentlyDeleteProject = async (projectId, userId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(userId, 'user id')

  const project = await Project.findById(projectId)
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  ensureIsOwner(project, userId)

  await Promise.all([
    Sprint.deleteMany({ projectId }),
    Issue.deleteMany({ projectId }),
  ])

  await Project.deleteOne({ _id: projectId })
}

// Danh sách project đã lưu trữ mà user hiện tại là OWNER (chỉ owner mới khôi phục/xóa được).
const getArchivedProjects = async (userId) => {
  return Project.find({
    isDeleted: true,
    members: { $elemMatch: { userId, role: 'OWNER', status: 'ACTIVE' } },
  })
    .sort({ updatedAt: -1 })
    .lean()
}

const leaveProject = async (projectId, userId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(userId, 'user id')

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const member = project.members.find(
    (m) => m.userId.toString() === userId.toString()
  )

  if (!member || member.status === 'REMOVED') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is not an active member of this project')
  }

  if (member.role === 'OWNER') {
    // Owner rời dự án -> xóa dự án
    await deleteProject(projectId)
    return {
      message: 'Project deleted because the Owner left.',
      role: 'OWNER',
    }
  } else {
    // Member rời dự án -> set assignee của các task của họ thành null
    member.status = 'REMOVED'
    await project.save()

    await Issue.updateMany(
      { projectId, assigneeId: userId, isDeleted: false },
      { $set: { assigneeId: null } }
    )

    // Gửi thông báo cho chủ sở hữu dự án khi thành viên rời dự án
    const owners = project.members.filter(
      (m) => m.role === 'OWNER' && m.status === 'ACTIVE'
    )
    if (owners.length > 0) {
      const leavingUser = await User.findById(userId).select('fullName').lean()
      const leavingUserName = leavingUser ? leavingUser.fullName : 'Thành viên'
      for (const owner of owners) {
        await notificationService.createNotification({
          userId: owner.userId,
          actorId: userId,
          projectId: project._id,
          type: 'MEMBER_LEFT',
          entityType: 'PROJECT',
          entityId: project._id,
          title: 'Thành viên rời dự án',
          message: `${leavingUserName} đã rời khỏi dự án "${project.name}".`,
        })
      }
    }

    return {
      message: 'Left project successfully. Your assigned tasks are now unassigned.',
      role: 'MEMBER',
    }
  }
}

// Chấp nhận lời mời tham gia dự án.
// `token` chỉ bắt buộc khi chấp nhận qua link email (xác thực đúng lời mời được gửi tới
// đúng email/project). Khi chấp nhận trực tiếp trong app (modal "Lời mời của tôi"), user đã
// đăng nhập nên bỏ qua bước xác thực token -> việc kiểm tra `member.status === 'PENDING'`
// bên dưới (khớp với đúng userId đang đăng nhập) đã đủ đảm bảo chỉ đúng người được mời mới
// chấp nhận được.
const acceptInvitation = async (projectId, userId, token) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(userId, 'user id')

  if (token) {
    let decoded
    try {
      decoded = await JwtProvider.verifyToken(token, env.ACCESS_TOKEN_SECRET)
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã xác nhận lời mời không hợp lệ hoặc đã hết hạn')
    }

    // Kiểm tra thông tin trong token khớp với request
    if (decoded.projectId !== projectId || decoded.userId !== userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thông tin xác nhận lời mời không khớp')
    }
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const member = project.members.find(
    (m) => m.userId.toString() === userId.toString()
  )

  if (!member || member.status !== 'PENDING') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Lời mời không tồn tại hoặc đã được xử lý')
  }

  member.status = 'ACTIVE'
  member.joinedAt = new Date()

  await project.save()

  // Trả về DTO sau khi đã populate
  const updatedProject = await Project.findById(projectId)
    .populate({ path: 'members.userId', select: 'fullName avatarUrl' })

  return toProjectDTO(updatedProject)
}

// Từ chối lời mời tham gia dự án. `token` optional -- xem giải thích ở acceptInvitation.
const declineInvitation = async (projectId, userId, token) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(userId, 'user id')

  if (token) {
    let decoded
    try {
      decoded = await JwtProvider.verifyToken(token, env.ACCESS_TOKEN_SECRET)
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã xác nhận lời mời không hợp lệ hoặc đã hết hạn')
    }

    if (decoded.projectId !== projectId || decoded.userId !== userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thông tin xác nhận lời mời không khớp')
    }
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const member = project.members.find(
    (m) => m.userId.toString() === userId.toString()
  )

  if (!member || member.status !== 'PENDING') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Lời mời không tồn tại hoặc đã được xử lý')
  }

  // Xóa khỏi danh sách thành viên dự án
  project.members = project.members.filter(
    (m) => m.userId.toString() !== userId.toString()
  )

  await project.save()

  const updatedProject = await Project.findById(projectId)
    .populate({ path: 'members.userId', select: 'fullName avatarUrl' })

  return toProjectDTO(updatedProject)
}

const removeMember = async (projectId, ownerUserId, targetUserId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(ownerUserId, 'owner user id')
  ensureValidObjectId(targetUserId, 'target user id')

  if (ownerUserId.toString() === targetUserId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Chủ dự án không thể tự xóa chính mình')
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  const member = project.members.find(
    (m) => m.userId.toString() === targetUserId.toString()
  )

  if (!member || member.status === 'REMOVED') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Thành viên không hoạt động hoặc không tồn tại trong dự án')
  }

  member.status = 'REMOVED'
  await project.save()

  // Chuyển toàn bộ task đang gán cho user bị xóa thành unassigned (assigneeId = null)
  await Issue.updateMany(
    { projectId, assigneeId: targetUserId, isDeleted: false },
    { $set: { assigneeId: null } }
  )

  // Gửi thông báo trong hệ thống cho thành viên bị xóa
  await notificationService.createNotification({
    userId: targetUserId,
    actorId: ownerUserId,
    projectId: project._id,
    type: 'INVITATION',
    entityType: 'PROJECT',
    entityId: project._id,
    title: 'Bị xóa khỏi dự án',
    message: `Bạn đã bị xóa khỏi dự án "${project.name}" bởi Trưởng nhóm.`,
  })

  const updatedProject = await Project.findById(projectId)
    .populate({ path: 'members.userId', select: 'fullName avatarUrl' })

  return toProjectDTO(updatedProject)
}

export const projectService = {
  createProject,
  inviteMembers,
  getMyProjects,
  getMyInvitations,
  getProjectById,
  updateProject,
  deleteProject,
  restoreProject,
  permanentlyDeleteProject,
  getArchivedProjects,
  leaveProject,
  acceptInvitation,
  declineInvitation,
  removeMember,
}

