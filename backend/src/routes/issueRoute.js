import express from 'express'
import {
  createIssue,
  getIssuesByProject,
  getIssuesBySprint,
  getIssueById,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
} from '../controllers/issueController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../middlewares/projectAuthMiddleware.js'

// mergeParams: true để lấy :projectId từ route cha (/projects/:projectId/issues).
const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Xem danh sách / chi tiết: OWNER, ADMIN, MEMBER.
router.get(
  '/',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getIssuesByProject,
)

router.get(
  '/sprint/:sprintId',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getIssuesBySprint,
)

router.get(
  '/:issueId',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getIssueById,
)

// Tạo / cập nhật toàn bộ: OWNER, ADMIN.
router.post(
  '/',
  authorizeProjectRole('OWNER', 'ADMIN'),
  createIssue,
)

router.put(
  '/:issueId',
  authorizeProjectRole('OWNER', 'ADMIN'),
  updateIssue,
)

// Cập nhật riêng status: OWNER, ADMIN, MEMBER.
router.patch(
  '/:issueId/status',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  updateIssueStatus,
)

// Xóa mềm: chỉ OWNER.
router.delete(
  '/:issueId',
  authorizeProjectRole('OWNER'),
  deleteIssue,
)

export default router
