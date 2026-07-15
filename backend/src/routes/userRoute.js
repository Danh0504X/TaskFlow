import express from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { requireAdmin } from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Toàn bộ route quản lý tài khoản: yêu cầu đăng nhập + quyền admin.
router.use(protectedRoute, requireAdmin)

router.get('/', getAllUsers)
router.post('/', createUser)
router.get('/:userId', getUserById)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)

export default router
