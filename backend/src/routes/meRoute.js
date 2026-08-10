import express from 'express'
import { getMyTasks, getUpcomingSprints, getAiQuota } from '../controllers/meController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'

// Các endpoint gộp dữ liệu của user hiện tại trên NHIỀU project cùng lúc — khác
// projectRoute (luôn scope theo 1 project qua :projectId + authorizeProjectRole).
const router = express.Router()

router.use(protectedRoute)

router.get('/tasks', getMyTasks)
router.get('/upcoming-sprints', getUpcomingSprints)
router.get('/ai-quota', getAiQuota)

export default router
