import express from 'express'
import {
  createProject,
  inviteMembers,
  getMyProjects,
  getMyInvitations,
  getProjectById,
  updateProject,
  deleteProject,
  getArchivedProjects,
  restoreProject,
  permanentlyDeleteProject,
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

// Danh sách project đã lưu trữ (isDeleted: true) mà user là OWNER.
// Phải đứng TRƯỚC route "/:projectId" bên dưới, nếu không "archived" sẽ bị hiểu nhầm là :projectId.
router.get('/archived', getArchivedProjects)

// Danh sách lời mời tham gia dự án đang chờ user hiện tại xử lý (status PENDING).
// Cùng lý do trên: phải đứng TRƯỚC route "/:projectId".
router.get('/invitations', getMyInvitations)

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

// Khôi phục project đã lưu trữ: chỉ OWNER. Không dùng authorizeProjectRole vì project lúc
// này isDeleted:true (middleware đó luôn lọc isDeleted:false) — quyền OWNER được check
// trong service sau khi tìm project theo đúng isDeleted:true.
router.patch('/:projectId/restore', restoreProject)

// Xóa vĩnh viễn (hard delete): chỉ OWNER. Cùng lý do trên, quyền check trong service.
router.delete('/:projectId/permanent', permanentlyDeleteProject)

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

