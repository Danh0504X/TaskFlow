import express from 'express'
import {
  createGeneration,
  clarifyRequirement,
  listGenerations,
  getGeneration,
  addManualDraft,
  editDraft,
  deleteDraft,
  clearEpicTaskDrafts,
  getEpicTaskDrafts,
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

// Task nháp hiện có của 1 epic thật (dùng khi mở modal "Sinh Task bằng AI"). Xoá tất cả & sinh
// lại từ đầu — không tốn quota (không gọi AI, chỉ dọn draft).
router.get('/epics/:epicId/task-drafts', getEpicTaskDrafts)
router.delete('/epics/:epicId/task-drafts', clearEpicTaskDrafts)

export default router
