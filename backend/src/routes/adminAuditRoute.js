import express from 'express'
import { getAuditLogs, createAuditLog } from '../controllers/adminAuditController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

router.use(protectedRoute, requireAdmin)

router.get('/', getAuditLogs)
router.post('/', createAuditLog)

export default router
