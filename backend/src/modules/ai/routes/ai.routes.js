import express from 'express'
import {
  createGeneration,
  clarifyRequirement,
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
import { checkAiLimit } from '../../../middlewares/checkAiLimit.js'

// Beta/Demo — AI Lab. Mounted tại /projects/:projectId/ai (xem routes/api.js).
// mergeParams: true để lấy :projectId từ route cha, giống issueRoute.js/sprintRoute.js.
const router = express.Router({ mergeParams: true })

router.use(protectedRoute)

// Chỉ chủ dự án (role OWNER — vai trò duy nhất có toàn quyền quản trị project trong hệ thống
// hiện tại, tương đương "PM" trong tài liệu thiết kế tính năng) được dùng AI Lab. MEMBER bị 403.
router.use(authorizeProjectRole('OWNER'))

// checkAiLimit áp cho route TẠO lượt sinh mới VÀ route hỏi làm rõ (CLARIFY cũng là 1
// AiGeneration, tính chung quota 15 lượt/ngày) — list/detail/accept/reject không tốn quota.
router.post('/clarify', checkAiLimit, clarifyRequirement)
router.post('/generations', checkAiLimit, createGeneration)
router.get('/generations', listGenerations)
router.get('/generations/:genId', getGeneration)
router.post('/generations/:genId/drafts', addManualDraft)
router.post('/generations/:genId/accept', acceptDrafts)
router.post('/generations/:genId/reject', rejectDrafts)

router.patch('/drafts/:draftId', editDraft)
router.delete('/drafts/:draftId', deleteDraft)

export default router
