import express from 'express'
import {
  createIssue,
  getIssuesByProject,
  getIssuesBySprint,
  getIssueById,
  updateIssue,
  updateIssueStatus,
  rejectIssue,
  deleteIssue,
} from '../controllers/issueController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../middlewares/projectAuthMiddleware.js'
import commentRoute from './commentRoute.js'

// mergeParams: true để lấy :projectId từ route cha (/projects/:projectId/issues).
const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Nested comment route: /projects/:projectId/issues/:issueId/comments
router.use('/:issueId/comments', commentRoute)

// Xem danh sách / chi tiết: OWNER, MEMBER.
router.get(
  '/',
  authorizeProjectRole('OWNER', 'MEMBER'),
  getIssuesByProject,
)

router.get(
  '/sprint/:sprintId',
  authorizeProjectRole('OWNER', 'MEMBER'),
  getIssuesBySprint,
)

router.get(
  '/:issueId',
  authorizeProjectRole('OWNER', 'MEMBER'),
  getIssueById,
)

// Tạo / cập nhật toàn bộ: chỉ OWNER.
router.post(
  '/',
  authorizeProjectRole('OWNER'),
  createIssue,
)

router.put(
  '/:issueId',
  authorizeProjectRole('OWNER'),
  updateIssue,
)

// Từ chối task đang ở IN_REVIEW: chỉ OWNER.
router.post(
  '/:issueId/reject',
  authorizeProjectRole('OWNER'),
  rejectIssue,
)

// Cập nhật riêng status: OWNER, MEMBER.
router.patch(
  '/:issueId/status',
  authorizeProjectRole('OWNER', 'MEMBER'),
  updateIssueStatus,
)

// Xóa mềm: chỉ OWNER.
router.delete(
  '/:issueId',
  authorizeProjectRole('OWNER'),
  deleteIssue,
)

export default router
