import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import AiGeneration from '../../../models/aiGenerations.js'
import AiDraftIssue from '../../../models/aiDraftIssues.js'
import Issue from '../../../models/issues.js'
import Project from '../../../models/projects.js'
import ApiError from '../../../utils/ApiError.js'
import { DRAFT_PRIORITIES, ensureValidObjectId, resolveSessionGenerationIds } from './aiShared.util.js'

// Beta/Demo — AI Lab. Vòng đời của AiDraftIssue: sửa/thêm tay/xoá/từ chối/chấp nhận (chấp nhận ->
// tạo issue THẬT). Tách khỏi aiGeneration.service.js (vốn lo việc gọi AI + vòng đời AiGeneration)
// để mỗi file chỉ còn 1 mối quan tâm — xem resolveSessionGenerationIds trong aiShared.util.js cho
// khái niệm "phiên" dùng xuyên suốt các hàm bên dưới.

const DRAFT_TYPES = ['EPIC', 'TASK']

// Tạo issue THẬT từ 1 draft đã được chấp nhận. Không tái dùng issueService.createIssue vì hàm đó
// chưa hỗ trợ set aiGenerated=true (issueService.js không nằm trong 4 file được phép sửa) — vẫn
// dùng chung Issue/Project model, cùng cách tăng issueSeq nguyên tử như issueService.
const createRealIssueFromDraft = async ({ projectId, requestedBy, title, description, type, priority, parentIssueId }) => {
  const updatedProject = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    { $inc: { issueSeq: 1 } },
    { new: true },
  )
  if (!updatedProject) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found')
  }

  return Issue.create({
    projectId,
    createdBy: requestedBy,
    issueNumber: updatedProject.issueSeq,
    title,
    description: description || '',
    type,
    priority,
    parentIssueId: parentIssueId || null,
    aiGenerated: true,
  })
}

const findDraftOr404 = async (draftId) => {
  ensureValidObjectId(draftId, 'draft id')
  const draft = await AiDraftIssue.findById(draftId)
  if (!draft) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Draft not found')
  }
  return draft
}

const editDraft = async (draftId, body = {}) => {
  const draft = await findDraftOr404(draftId)

  if (draft.status !== 'SUGGESTED') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ có thể sửa draft đang ở trạng thái SUGGESTED')
  }

  if (body.title !== undefined) {
    if (!body.title || !body.title.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Title không được rỗng')
    }
    draft.title = body.title.trim()
  }

  if (body.description !== undefined) {
    draft.description = body.description?.trim() || ''
  }

  if (body.priority !== undefined) {
    if (!DRAFT_PRIORITIES.includes(body.priority)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid priority')
    }
    draft.priority = body.priority
  }

  await draft.save()
  return draft
}

const addManualDraft = async (generationId, body = {}) => {
  ensureValidObjectId(generationId, 'generation id')

  const generation = await AiGeneration.findById(generationId).lean()
  if (!generation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Generation not found')
  }

  const { title, description, type, priority, parentTempId, parentIssueId } = body

  if (!title || !title.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Title là bắt buộc')
  }
  if (!DRAFT_TYPES.includes(type)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid type')
  }
  // parentIssueId: task thêm tay vào danh sách PHẲNG của 1 epic THẬT (AiQuickGenerateModal) —
  // khác parentTempId (task/epic thêm tay CÙNG LÔ với 1 epic nháp khác trong batch).
  if (parentIssueId) {
    ensureValidObjectId(parentIssueId, 'parent issue id')
  }

  const tempId = `M-${new mongoose.Types.ObjectId().toString().slice(-8)}`

  const draft = await AiDraftIssue.create({
    generationId,
    projectId: generation.projectId,
    tempId,
    title: title.trim(),
    description: description?.trim() || '',
    type,
    priority: DRAFT_PRIORITIES.includes(priority) ? priority : 'MEDIUM',
    parentTempId: parentTempId || null,
    parentIssueId: parentIssueId || null,
    scopePreview: [],
    sourceQuote: '',
    origin: 'MANUAL',
    status: 'SUGGESTED',
  })

  return draft
}

const deleteDraft = async (draftId) => {
  const draft = await findDraftOr404(draftId)

  if (draft.status === 'ACCEPTED') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Không thể xoá draft đã được chấp nhận')
  }

  // Cascade xoá con (task nháp có parentTempId trỏ tới draft vừa xoá) trong TOÀN PHIÊN — con có
  // thể nằm ở 1 turn khác (sinh sau, riêng lẻ), không chỉ trong generationId của bản thân draft
  // này. Không cascade xuống con đã ACCEPTED (đã thành issue thật, không xoá được, giữ nguyên).
  const sessionGenerationIds = await resolveSessionGenerationIds(draft.generationId)
  await AiDraftIssue.deleteMany({
    generationId: { $in: sessionGenerationIds },
    parentTempId: draft.tempId,
    status: { $ne: 'ACCEPTED' },
  })

  await AiDraftIssue.deleteOne({ _id: draftId })
  return draft
}

/**
 * "Xoá tất cả & sinh lại từ đầu" cho 1 epic THẬT — XOÁ HẲN (không phải từ chối) mọi task nháp
 * CHƯA được duyệt (SUGGESTED lẫn REJECTED — dọn sạch luôn rác đã từ chối) của epic đó, làm sạch
 * không gian để bấm "Sinh Task" lại không bị chống-trùng vướng vào đề xuất cũ. Task ĐÃ duyệt
 * (ACCEPTED — đã là issue thật) KHÔNG bị đụng tới, không xoá được và cũng không nên xoá.
 *
 * Không xoá các doc `AiGeneration` (turn) đã tạo trước đó — giữ lại để không "hoàn" quota
 * checkAiLimit đã tính (xoá turn sẽ vô tình cho phép né hạn mức AI/ngày bằng cách xoá-rồi-sinh-lại
 * liên tục). Chỉ dọn phần hiển thị (AiDraftIssue), không đụng phần tính phí/audit.
 */
const clearEpicTaskDrafts = async (projectId, epicId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(epicId, 'epic id')

  const result = await AiDraftIssue.deleteMany({
    projectId,
    parentIssueId: epicId,
    status: { $ne: 'ACCEPTED' },
  })

  return { deletedCount: result.deletedCount }
}

/**
 * Trạng thái "phiên Sinh Task" hiện tại của 1 epic THẬT — dùng để FE mở modal là thấy ngay bố
 * cục quản lý task nháp (không cần màn hình form riêng ở giữa nữa). `generationId` là turn gần
 * nhất (bất kỳ turn nào trong phiên cũng dùng được cho accept/reject/edit/delete — đều tự resolve
 * đúng cả phiên qua resolveSessionGenerationIds); `null` nếu epic này CHƯA từng "Sinh Task" lần
 * nào — FE khi đó chỉ hiện nút "Sinh Task", chưa có gì để duyệt/sửa/xoá.
 */
const getEpicTaskDrafts = async (projectId, epicId) => {
  ensureValidObjectId(projectId, 'project id')
  ensureValidObjectId(epicId, 'epic id')

  const latestTurn = await AiGeneration.findOne({
    projectId,
    sourceEntityId: epicId,
    generationType: 'EPIC_TO_TASK',
    sourceKind: 'ISSUE',
  })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean()

  if (!latestTurn) {
    return { generationId: null, drafts: [] }
  }

  const drafts = await AiDraftIssue.find({ projectId, parentIssueId: epicId })
    .sort({ createdAt: 1 })
    .lean()

  return { generationId: latestTurn._id.toString(), drafts }
}

const rejectDrafts = async (generationId, ids = []) => {
  ensureValidObjectId(generationId, 'generation id')

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'ids không được rỗng')
  }
  ids.forEach((id) => ensureValidObjectId(id, 'draft id'))

  const sessionGenerationIds = await resolveSessionGenerationIds(generationId)

  const targets = await AiDraftIssue.find({
    _id: { $in: ids },
    generationId: { $in: sessionGenerationIds },
    status: 'SUGGESTED',
  }).select('tempId')
  const tempIds = targets.map((d) => d.tempId)

  // Cascade xuống con (task nháp có parentTempId trỏ tới epic vừa bị từ chối, có thể nằm ở 1
  // turn khác trong cùng phiên) — không chặn, để PM không phải tự tay từ chối từng task con
  // trước khi từ chối được epic.
  await AiDraftIssue.updateMany(
    {
      generationId: { $in: sessionGenerationIds },
      status: 'SUGGESTED',
      $or: [{ _id: { $in: ids } }, { parentTempId: { $in: tempIds } }],
    },
    { $set: { status: 'REJECTED' } },
  )

  return { rejected: ids }
}

/**
 * Chấp nhận 1 hoặc nhiều draft -> tạo issue THẬT. Xử lý CHA TRƯỚC CON SAU (EPIC trước TASK).
 * - Draft có parentTempId mà cha KHÔNG được chấp nhận (không nằm trong tempIds, hoặc bản thân
 *   cha đó chưa/không ACCEPTED) -> tự REJECTED, trả rõ trong `skipped` (chống mồ côi).
 * - Đã có createdIssueId (accept lần 2/double-click) -> bỏ qua, trả lại mapping cũ (idempotent).
 */
const acceptDrafts = async (generationId, tempIds, requestedBy) => {
  ensureValidObjectId(generationId, 'generation id')

  if (!Array.isArray(tempIds) || tempIds.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'tempIds không được rỗng')
  }

  const generation = await AiGeneration.findById(generationId).lean()
  if (!generation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Generation not found')
  }

  // Gộp draft của CẢ PHIÊN — epic và task sinh ra từ nó có thể nằm ở 2 turn khác nhau (xem
  // resolveSessionGenerationIds), phải thấy đủ cả 2 mới resolve cha-con đúng.
  const sessionGenerationIds = await resolveSessionGenerationIds(generationId)
  const allDrafts = await AiDraftIssue.find({ generationId: { $in: sessionGenerationIds } })
  const draftByTempId = new Map(allDrafts.map((d) => [d.tempId, d]))

  // tempId -> id issue thật, gồm cả những draft đã ACCEPTED từ lượt trước đó.
  const acceptedRealId = new Map()
  for (const d of allDrafts) {
    if (d.status === 'ACCEPTED' && d.createdIssueId) {
      acceptedRealId.set(d.tempId, d.createdIssueId.toString())
    }
  }

  // EPIC trước TASK để cha luôn có issue thật trước khi xử lý con.
  const toProcess = tempIds
    .map((tempId) => draftByTempId.get(tempId))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.type === b.type) return 0
      return a.type === 'EPIC' ? -1 : 1
    })

  const created = []
  const skipped = []

  for (const draft of toProcess) {
    if (draft.status === 'ACCEPTED' && draft.createdIssueId) {
      created.push({
        draftId: draft._id,
        issueId: draft.createdIssueId,
        type: draft.type,
        title: draft.title,
        parentIssueId: draft.parentIssueId ?? null,
      })
      continue
    }

    if (draft.status === 'REJECTED') {
      skipped.push({ draftId: draft._id, tempId: draft.tempId, reason: 'REJECTED' })
      continue
    }

    let parentIssueId = null

    if (draft.parentTempId) {
      const parentRealId = acceptedRealId.get(draft.parentTempId)
      if (!parentRealId) {
        draft.status = 'REJECTED'
        await draft.save()
        skipped.push({ draftId: draft._id, tempId: draft.tempId, reason: 'PARENT_NOT_ACCEPTED' })
        continue
      }
      parentIssueId = parentRealId
    } else if (draft.parentIssueId) {
      // Cha là issue THẬT, đã stamp sẵn lúc AI sinh xong (xem runWorker) — không còn tra
      // generation.generationType/sourceEntityId nữa, draft tự mô tả đủ cha của chính nó.
      parentIssueId = draft.parentIssueId
    }

    const issue = await createRealIssueFromDraft({
      projectId: generation.projectId,
      requestedBy,
      title: draft.title,
      description: draft.description,
      type: draft.type,
      priority: draft.priority,
      parentIssueId,
    })

    draft.status = 'ACCEPTED'
    draft.createdIssueId = issue._id
    await draft.save()

    acceptedRealId.set(draft.tempId, issue._id.toString())

    created.push({
      draftId: draft._id,
      issueId: issue._id,
      type: draft.type,
      title: draft.title,
      parentIssueId,
    })
  }

  return { created, skipped }
}

export const aiDraftService = {
  editDraft,
  addManualDraft,
  deleteDraft,
  clearEpicTaskDrafts,
  getEpicTaskDrafts,
  rejectDrafts,
  acceptDrafts,
}
