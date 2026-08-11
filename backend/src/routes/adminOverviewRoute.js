import express from 'express'
import { getOverview } from '../controllers/adminOverviewController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Toàn bộ route tổng quan cho admin yêu cầu đăng nhập + quyền Admin.
router.use(protectedRoute, requireAdmin)

router.get('/', getOverview)

export default router
