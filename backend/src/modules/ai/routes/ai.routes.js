import express from 'express'
import {
  createGeneration,
  listGenerations,
  getGeneration,
  addManualDraft,
  editDraft,
  deleteDraft,
  acceptDrafts,
  rejectDrafts,
} from '../controllers/aiGeneration.controller.js'
import { protectedRoute } from '../../../middlewares/authMiddleware.js'
import { authorizeProjectRole } from '../../../middlewares/projectAuthMiddleware.js'

// Beta/Demo — AI Lab. Mounted tại /projects/:projectId/ai (xem routes/api.js).
// mergeParams: true để lấy :projectId từ route cha, giống issueRoute.js/sprintRoute.js.
const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Chỉ chủ dự án (role OWNER — vai trò duy nhất có toàn quyền quản trị project trong hệ thống
// hiện tại, tương đương "PM" trong tài liệu thiết kế tính năng) được dùng AI Lab. MEMBER bị 403.
router.use(authorizeProjectRole('OWNER'))

router.post('/generations', createGeneration)
router.get('/generations', listGenerations)
router.get('/generations/:genId', getGeneration)
router.post('/generations/:genId/drafts', addManualDraft)
router.post('/generations/:genId/accept', acceptDrafts)
router.post('/generations/:genId/reject', rejectDrafts)

router.patch('/drafts/:draftId', editDraft)
router.delete('/drafts/:draftId', deleteDraft)

export default router
