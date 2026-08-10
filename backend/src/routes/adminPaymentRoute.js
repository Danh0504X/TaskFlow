import express from 'express'
import {
  getPendingResolutions,
  resolveTransactionManually,
  getWebhookLogs,
  searchUsersForResolution,
} from '../controllers/adminPaymentController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Toàn bộ route admin payment yêu cầu đăng nhập và có quyền Admin
router.use(protectedRoute, requireAdmin)

// Lấy danh sách giao dịch lỗi chờ xử lý thủ công (PAY-08, PAY-09)
router.get('/pending-resolutions', getPendingResolutions)

// Lấy nhật ký webhook SePay (PAY-08)
router.get('/webhook-logs', getWebhookLogs)

// Duyệt thủ công 1-Click hoặc cấp/gỡ gói PRO thủ công (PAY-09)
router.post('/:transactionId/resolve', resolveTransactionManually)

// Tìm kiếm người dùng theo email/tên để gán đơn lỗi (PAY-09)
router.get('/users/search', searchUsersForResolution)

export default router
