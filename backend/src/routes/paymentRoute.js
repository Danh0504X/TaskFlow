import express from 'express'
import {
  createPaymentOrder,
  checkPaymentStatus,
  handleSePayWebhook,
} from '../controllers/paymentController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Webhook từ SePay (Công khai, SePay gọi trực tiếp đến - hỗ trợ cả 2 chuẩn URL)
router.post('/webhook/sepay', handleSePayWebhook)
router.post('/sepay-webhook', handleSePayWebhook)

// Các route yêu cầu người dùng đăng nhập
router.post('/create-order', protectedRoute, createPaymentOrder)
router.get('/status/:paymentCode', protectedRoute, checkPaymentStatus)

export default router
