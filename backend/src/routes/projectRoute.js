import express from 'express'
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
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

// Xem chi tiết: OWNER / ADMIN / MEMBER.
router.get(
  '/:projectId',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getProjectById,
)

// Cập nhật: OWNER / ADMIN.
router.put(
  '/:projectId',
  authorizeProjectRole('OWNER', 'ADMIN'),
  updateProject,
)

// Xóa mềm: chỉ OWNER.
router.delete(
  '/:projectId',
  authorizeProjectRole('OWNER'),
  deleteProject,
)

// Nested routes: sprint & issue luôn nằm trong 1 project.
router.use('/:projectId/sprints', sprintRoute)
router.use('/:projectId/issues', issueRoute)

export default router
