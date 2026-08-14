import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import AiGeneration from '../../../models/aiGenerations.js'
import ApiError from '../../../utils/ApiError.js'

// Beta/Demo — AI Lab. Helper dùng chung giữa aiGeneration.service.js (vòng đời generation) và
// aiDraft.service.js (vòng đời draft) — tách riêng để 2 file đó không phải import ngược lẫn nhau.

export const DRAFT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

/**
 * Gom 1 "phiên" (session) thành mảng generationId phẳng — nhận vào generationId BẤT KỲ (gốc hoặc
 * 1 turn con) đều ra đúng cùng 1 tập. Dùng ở mọi nơi cần đọc/ghi draft theo phạm vi cả phiên
 * (getGeneration/acceptDrafts/rejectDrafts/deleteDraft) thay vì chỉ theo đúng 1 generationId.
 *
 * 2 cách gom, tuỳ nguồn epic của turn:
 * - sourceKind='ISSUE' (epic THẬT): gom mọi turn EPIC_TO_TASK cùng sourceEntityId — 1 epic thật
 *   luôn chỉ có ĐÚNG 1 "phiên" duy nhất, không cần khái niệm gốc/con vì sourceEntityId đã là khoá
 *   tự nhiên (mỗi lần bấm "Sinh Task" trên cùng epic đó luôn thuộc cùng phiên).
 * - Còn lại (REQ_TO_EPIC, hoặc EPIC_TO_TASK từ epic NHÁP): gom theo parentGenerationId như cũ —
 *   null = doc này là gốc phiên, khác null = turn con trỏ về gốc.
 */
export const resolveSessionGenerationIds = async (generationId) => {
  const doc = await AiGeneration.findById(generationId)
    .select('parentGenerationId sourceKind sourceEntityId generationType')
    .lean()
  if (!doc) return [generationId]

  if (doc.generationType === 'EPIC_TO_TASK' && doc.sourceKind === 'ISSUE' && doc.sourceEntityId) {
    const siblings = await AiGeneration.find({
      generationType: 'EPIC_TO_TASK',
      sourceKind: 'ISSUE',
      sourceEntityId: doc.sourceEntityId,
    })
      .select('_id')
      .lean()
    return siblings.map((s) => s._id.toString())
  }

  const rootId = doc.parentGenerationId ? doc.parentGenerationId.toString() : generationId.toString()
  const turns = await AiGeneration.find({ parentGenerationId: rootId }).select('_id').lean()

  return [rootId, ...turns.map((t) => t._id.toString())]
}
