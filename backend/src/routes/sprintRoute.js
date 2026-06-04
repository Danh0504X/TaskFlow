import express from 'express'
import {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
} from '../controllers/sprintController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../middlewares/projectAuthMiddleware.js'

// mergeParams: true để lấy được :projectId từ route cha (/projects/:projectId/sprints).
const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Xem danh sách / chi tiết: OWNER, ADMIN, MEMBER.
router.get(
  '/',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getSprintsByProject,
)

router.get(
  '/:sprintId',
  authorizeProjectRole('OWNER', 'ADMIN', 'MEMBER'),
  getSprintById,
)

// Tạo / cập nhật: OWNER, ADMIN.
router.post(
  '/',
  authorizeProjectRole('OWNER', 'ADMIN'),
  createSprint,
)

router.put(
  '/:sprintId',
  authorizeProjectRole('OWNER', 'ADMIN'),
  updateSprint,
)

// Xóa / start / complete: chỉ OWNER.
router.delete(
  '/:sprintId',
  authorizeProjectRole('OWNER'),
  deleteSprint,
)

router.patch(
  '/:sprintId/start',
  authorizeProjectRole('OWNER'),
  startSprint,
)

router.patch(
  '/:sprintId/complete',
  authorizeProjectRole('OWNER'),
  completeSprint,
)

export default router
