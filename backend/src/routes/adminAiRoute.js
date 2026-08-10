import express from 'express'
import { getOverview, getQuotaLeaderboard } from '../controllers/adminAiController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Toàn bộ route giám sát AI cho admin yêu cầu đăng nhập + quyền Admin.
router.use(protectedRoute, requireAdmin)

router.get('/overview', getOverview)
router.get('/quota', getQuotaLeaderboard)

export default router
