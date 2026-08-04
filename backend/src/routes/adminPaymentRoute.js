import express from 'express'
import {
  getPendingResolutions,
  resolveTransactionManually,
  searchUsersForResolution,
} from '../controllers/adminPaymentController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Toàn bộ route admin payment yêu cầu đăng nhập và có quyền Admin
router.use(protectedRoute, requireAdmin)

// Lấy danh sách giao dịch lỗi chờ xử lý thủ công
router.get('/pending-resolutions', getPendingResolutions)

// Duyệt thủ công 1-Click cho giao dịch lỗi
router.post('/:transactionId/resolve', resolveTransactionManually)

// Tìm kiếm người dùng theo email/tên để gán đơn lỗi
router.get('/users/search', searchUsersForResolution)

export default router
