import express from 'express'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../middlewares/projectAuthMiddleware.js'

const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Xem và tạo bình luận: OWNER, MEMBER.
router.get(
  '/',
  authorizeProjectRole('OWNER', 'MEMBER'),
  getComments,
)

router.post(
  '/',
  authorizeProjectRole('OWNER', 'MEMBER'),
  createComment,
)

// Sửa bình luận: OWNER, MEMBER (Service sẽ kiểm tra chính chủ -> 403 nếu không phải).
router.put(
  '/:commentId',
  authorizeProjectRole('OWNER', 'MEMBER'),
  updateComment,
)

// Xoá bình luận: OWNER, MEMBER (Service sẽ kiểm tra chính chủ hoặc Project Owner -> 403 nếu khác).
router.delete(
  '/:commentId',
  authorizeProjectRole('OWNER', 'MEMBER'),
  deleteComment,
)

export default router
