import express from 'express'
import {
  createProject,
  inviteMembers,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  leaveProject,
  acceptInvitation,
  declineInvitation,
} from '../controllers/projectController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../middlewares/projectAuthMiddleware.js'
import sprintRoute from './sprintRoute.js'
import issueRoute from './issueRoute.js'

const router = express.Router()

// Tất cả route project đều yêu cầu đăng nhập.
router.use(protectedRoute)

// Tạo project: chỉ cần đăng nhập. Người tạo là OWNER.
router.post('/', createProject)

// Lấy danh sách project mà user tham gia.
router.get('/', getMyProjects)

// Xem chi tiết: OWNER / MEMBER.
router.get(
  '/:projectId',
  authorizeProjectRole('OWNER', 'MEMBER'),
  getProjectById,
)

// Cập nhật: chỉ OWNER.
router.put(
  '/:projectId',
  authorizeProjectRole('OWNER'),
  updateProject,
)

// Mời thành viên qua email: chỉ OWNER.
router.post(
  '/:projectId/members/invite',
  authorizeProjectRole('OWNER'),
  inviteMembers,
)

// Xóa mềm: chỉ OWNER.
router.delete(
  '/:projectId',
  authorizeProjectRole('OWNER'),
  deleteProject,
)

// Rời dự án: OWNER / MEMBER.
router.post(
  '/:projectId/leave',
  authorizeProjectRole('OWNER', 'MEMBER'),
  leaveProject,
)

// Chấp nhận / từ chối lời mời: chỉ cần đăng nhập (status: PENDING nên không check role)
router.post(
  '/:projectId/invitation/accept',
  acceptInvitation,
)

router.post(
  '/:projectId/invitation/decline',
  declineInvitation,
)

// Nested routes: sprint & issue luôn nằm trong 1 project.
router.use('/:projectId/sprints', sprintRoute)
router.use('/:projectId/issues', issueRoute)

export default router

