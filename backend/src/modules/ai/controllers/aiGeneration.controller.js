import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../../../middlewares/asyncHandler.js'
import { aiGenerationService } from '../services/aiGeneration.service.js'

// Beta/Demo — AI Lab. Controller mỏng: nhận req, gọi service, trả JSON — lỗi tự next(err) qua asyncHandler.

// Tạo lượt sinh (REQ_TO_EPIC hoặc EPIC_TO_TASK) -> trả 202 ngay, xử lý AI ở nền.
export const createGeneration = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await aiGenerationService.createGeneration(projectId, req.user._id, req.body)

  res.status(StatusCodes.ACCEPTED).json({
    message: 'Đã tạo lượt sinh, đang xử lý ở nền',
    data: result,
  })
})

// AI hỏi làm rõ TRƯỚC khi tạo lượt REQ_TO_EPIC thật -> 200 đồng bộ (khác 202 nền của createGeneration).
export const clarifyRequirement = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await aiGenerationService.clarifyRequirement(projectId, req.user._id, req.body)

  res.status(StatusCodes.OK).json({
    message: 'Đã sinh câu hỏi làm rõ',
    data: result,
  })
})

export const listGenerations = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const result = await aiGenerationService.listGenerations(projectId, req.query)

  res.status(StatusCodes.OK).json({
    message: 'Get generations successfully',
    data: result,
  })
})

// Chi tiết + drafts — dùng cho FE poll tới khi COMPLETED/FAILED.
export const getGeneration = asyncHandler(async (req, res) => {
  const { genId } = req.params
  const result = await aiGenerationService.getGeneration(genId)

  res.status(StatusCodes.OK).json({
    message: 'Get generation detail successfully',
    data: result,
  })
})

export const addManualDraft = asyncHandler(async (req, res) => {
  const { genId } = req.params
  const result = await aiGenerationService.addManualDraft(genId, req.body)

  res.status(StatusCodes.CREATED).json({
    message: 'Đã thêm draft thủ công',
    data: result,
  })
})

export const editDraft = asyncHandler(async (req, res) => {
  const { draftId } = req.params
  const result = await aiGenerationService.editDraft(draftId, req.body)

  res.status(StatusCodes.OK).json({
    message: 'Đã cập nhật draft',
    data: result,
  })
})

export const deleteDraft = asyncHandler(async (req, res) => {
  const { draftId } = req.params
  const result = await aiGenerationService.deleteDraft(draftId)

  res.status(StatusCodes.OK).json({
    message: 'Đã xoá draft',
    data: result,
  })
})

// Body: { tempIds: string[] } -> tạo issue thật (aiGenerated=true), cha trước con sau.
export const acceptDrafts = asyncHandler(async (req, res) => {
  const { genId } = req.params
  const { tempIds } = req.body
  const result = await aiGenerationService.acceptDrafts(genId, tempIds, req.user._id)

  res.status(StatusCodes.OK).json({
    message: `Đã tạo ${result.created.length} issue`,
    data: result,
  })
})

// Body: { ids: string[] } (id của AiDraftIssue) -> set REJECTED.
export const rejectDrafts = asyncHandler(async (req, res) => {
  const { genId } = req.params
  const { ids } = req.body
  const result = await aiGenerationService.rejectDrafts(genId, ids)

  res.status(StatusCodes.OK).json({
    message: 'Đã từ chối các draft đã chọn',
    data: result,
  })
})

// "Xoá tất cả & sinh lại từ đầu" cho 1 epic thật — xoá HẲN mọi task nháp chưa duyệt của epic đó.
export const clearEpicTaskDrafts = asyncHandler(async (req, res) => {
  const { projectId, epicId } = req.params
  const result = await aiGenerationService.clearEpicTaskDrafts(projectId, epicId)

  res.status(StatusCodes.OK).json({
    message: `Đã xoá ${result.deletedCount} task nháp`,
    data: result,
  })
})

// Trạng thái "phiên Sinh Task" hiện tại của 1 epic thật — FE mở modal gọi ngay, không cần chờ
// bấm "Sinh Task" mới có gì để xem.
export const getEpicTaskDrafts = asyncHandler(async (req, res) => {
  const { projectId, epicId } = req.params
  const result = await aiGenerationService.getEpicTaskDrafts(projectId, epicId)

  res.status(StatusCodes.OK).json({
    message: 'Get epic task drafts successfully',
    data: result,
  })
})
