import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import AiGeneration from '../../../models/aiGenerations.js'
import AiDraftIssue from '../../../models/aiDraftIssues.js'
import Issue from '../../../models/issues.js'
import Project from '../../../models/projects.js'
import ApiError from '../../../utils/ApiError.js'
import { runAiGeneration, runAiClarify } from '../aiRunner.js'
import { aiEnv } from '../config/aiEnv.js'

// Beta/Demo — AI Lab. Layered giống issueService.js: Routes -> Controllers -> Services -> Models,
// validate thủ công + ApiError (module này không dùng zod/validateMiddleware, theo đúng cách
// issue/sprint route hiện có đang làm — KHÔNG bịa quy ước mới).

const GENERATION_TYPES = ['REQ_TO_EPIC', 'EPIC_TO_TASK']
const DRAFT_TYPES = ['EPIC', 'TASK']
const DRAFT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const ensureValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`)
  }
}

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

// Chạy nền (không await ở nơi gọi) — PENDING -> PROCESSING -> COMPLETED/FAILED.
const runWorker = async (generationId) => {
  const generation = await AiGeneration.findById(generationId)
  if (!generation) return

  try {
    generation.status = 'PROCESSING'
    await generation.save()

    let context

    if (generation.generationType === 'REQ_TO_EPIC') {
      const existingEpics = await Issue.find({
        projectId: generation.projectId,
        type: 'EPIC',
        isDeleted: false,
      })
        .select('title')
        .lean()

      context = {
        inputPrompt: generation.inputPrompt,
        clarifications: generation.clarifications,
        existingTitles: existingEpics.map((e) => e.title),
      }
    } else {
      const sourceEpic = await Issue.findOne({
        _id: generation.sourceEntityId,
        projectId: generation.projectId,
        isDeleted: false,
      }).lean()

      if (!sourceEpic) {
        throw new Error('Epic nguồn đã bị xoá trong lúc xử lý')
      }

      const existingTasks = await Issue.find({
        projectId: generation.projectId,
        parentIssueId: generation.sourceEntityId,
        isDeleted: false,
      })
        .select('title')
        .lean()

      context = {
        sourceEpic: { title: sourceEpic.title, description: sourceEpic.description },
        existingTitles: existingTasks.map((t) => t.title),
      }
    }

    const { items, tokensUsed, provider, model, rawOutput, entities } = await runAiGeneration(
      generation.generationType,
      context,
    )

    const draftDocs = items.map((item) => ({
      generationId: generation._id,
      projectId: generation.projectId,
      tempId: item.tempId,
      title: item.title,
      description: item.description || '',
      type: item.type,
      priority: DRAFT_PRIORITIES.includes(item.priority) ? item.priority : 'MEDIUM',
      parentTempId: item.parentTempId || null,
      scopePreview: Array.isArray(item.scopePreview) ? item.scopePreview : [],
      sourceQuote: item.sourceQuote || '',
      origin: 'AI',
      status: 'SUGGESTED',
    }))

    await AiDraftIssue.insertMany(draftDocs)

    generation.status = 'COMPLETED'
    generation.provider = provider
    generation.model = model
    generation.tokensUsed = tokensUsed || 0
    generation.rawOutput = rawOutput
    // Kết quả Stage A (trích thực thể) của REQ_TO_EPIC — rỗng với EPIC_TO_TASK, xem aiRunner.js.
    generation.extractedEntities = entities || []
    await generation.save()
  } catch (error) {
    console.error('>> [aiGeneration.runWorker] Error:', error)
    generation.status = 'FAILED'
    generation.errorMessage = error.message || 'AI generation failed'
    // aiRunner đính kèm tokensUsed/provider/model thật đã tiêu tới thời điểm lỗi (nếu có gọi AI
    // trước khi fail) — ghi lại để không mất dấu chi phí thật, dù lượt sinh này FAILED.
    generation.tokensUsed = error.tokensUsed || 0
    if (error.provider) generation.provider = error.provider
    if (error.model) generation.model = error.model
    await generation.save()
  }
}

const startOfTodayUtc = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Nguồn dùng chung duy nhất cho "đã dùng bao nhiêu lượt AI hôm nay" — dùng bởi CẢ
 * middlewares/checkAiLimit.js (chặn khi vượt hạn mức) LẪN GET /me/ai-quota (hiển thị cho user
 * xem, xem meController.js) để tránh 2 nơi tự tính rồi lệch nhau. Không lưu counter riêng, đếm
 * trực tiếp trên AiGeneration mỗi lần gọi (giống lý do đã ghi ở checkAiLimit.js cũ).
 * PRO còn hạn -> coi như không giới hạn (used luôn trả 0, không cần đếm tốn công).
 */
const getAiUsageToday = async (user) => {
  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()
  const limit = aiEnv.AI_DAILY_LIMIT

  if (isPro) {
    return { used: 0, limit, isPro: true }
  }

  const used = await AiGeneration.countDocuments({
    requestedBy: user._id,
    createdAt: { $gte: startOfTodayUtc() },
  })

  return { used, limit, isPro: false }
}

const createGeneration = async (projectId, requestedBy, body = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const { generationType, sourceEntityId, inputPrompt, clarifications } = body

  if (!GENERATION_TYPES.includes(generationType)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid generation type')
  }

  if (generationType === 'REQ_TO_EPIC') {
    if (!inputPrompt || !inputPrompt.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'inputPrompt is required for REQ_TO_EPIC')
    }
    if (inputPrompt.length > 5000) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'inputPrompt tối đa 5000 ký tự')
    }
  }

  if (generationType === 'EPIC_TO_TASK') {
    if (!sourceEntityId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'sourceEntityId is required for EPIC_TO_TASK')
    }
    ensureValidObjectId(sourceEntityId, 'source entity id')

    const sourceEpic = await Issue.findOne({
      _id: sourceEntityId,
      projectId,
      type: 'EPIC',
      isDeleted: false,
    }).lean()

    if (!sourceEpic) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Epic nguồn không tồn tại hoặc đã bị xoá')
    }
  }

  // Rate limit hằng ngày đã được chặn ở middleware checkAiLimit trên route POST .../generations
  // (xem backend/src/middlewares/checkAiLimit.js) — không kiểm lại ở đây nữa.
  const generation = await AiGeneration.create({
    projectId,
    requestedBy,
    generationType,
    sourceEntityId: generationType === 'EPIC_TO_TASK' ? sourceEntityId : null,
    inputPrompt: generationType === 'REQ_TO_EPIC' ? inputPrompt.trim() : '',
    clarifications: clarifications ?? null,
    status: 'PENDING',
  })

  // Không await -> trả 202 ngay, xử lý AI ở nền (setImmediate thay vì queue/redis).
  setImmediate(() => {
    runWorker(generation._id).catch((error) => {
      console.error('>> [aiGeneration] Unhandled worker error:', error)
    })
  })

  return { generationId: generation._id, status: generation.status }
}

/**
 * AI hỏi làm rõ TRƯỚC khi PM tạo lượt REQ_TO_EPIC thật — 1 lệnh gọi AI đồng bộ (không nền, không
 * tạo AiDraftIssue). Lưu thành 1 AiGeneration với generationType='CLARIFY' để: (1) tính chung
 * vào quota checkAiLimit (middleware chỉ đếm AiGeneration.countDocuments, không cần sửa gì), và
 * (2) giữ lại audit token/lỗi thật đã tiêu, giống pattern runWorker đang dùng.
 */
const clarifyRequirement = async (projectId, requestedBy, body = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const { inputPrompt } = body
  if (!inputPrompt || !inputPrompt.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'inputPrompt is required')
  }
  if (inputPrompt.length > 5000) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'inputPrompt tối đa 5000 ký tự')
  }

  const trimmedPrompt = inputPrompt.trim()

  try {
    const { questions, tokensUsed, provider, model } = await runAiClarify(trimmedPrompt)

    const generation = await AiGeneration.create({
      projectId,
      requestedBy,
      generationType: 'CLARIFY',
      inputPrompt: trimmedPrompt,
      status: 'COMPLETED',
      clarifyingQuestions: questions,
      tokensUsed: tokensUsed || 0,
      provider,
      model,
    })

    return { generationId: generation._id, questions }
  } catch (error) {
    // Ghi lại chi phí thật đã tiêu (nếu có gọi AI trước khi lỗi) thay vì để mất dấu — cùng
    // pattern với runWorker khi generation FAILED.
    await AiGeneration.create({
      projectId,
      requestedBy,
      generationType: 'CLARIFY',
      inputPrompt: trimmedPrompt,
      status: 'FAILED',
      errorMessage: error.message || 'AI clarify failed',
      tokensUsed: error.tokensUsed || 0,
      provider: error.provider || null,
      model: error.model || null,
    })
    throw error
  }
}

// Populate sourceEntityId -> title epic nguồn, để FE hiện được "sinh từ epic nào" trong danh
// sách lượt sinh (EPIC_TO_TASK). REQ_TO_EPIC không có sourceEntityId (null) -> FE dùng inputPrompt
// (đã có sẵn trong document, không cần populate) để hiện "sinh từ yêu cầu nào".
const SOURCE_EPIC_POPULATE = { path: 'sourceEntityId', select: 'title' }

const listGenerations = async (projectId, filters = {}) => {
  ensureValidObjectId(projectId, 'project id')

  const filter = { projectId }
  if (filters.status) filter.status = filters.status
  if (filters.generationType) filter.generationType = filters.generationType

  return AiGeneration.find(filter)
    .sort({ createdAt: -1 })
    .populate(SOURCE_EPIC_POPULATE)
    .lean()
}

/**
 * Số liệu "cộng dồn" (tổng/trung bình token) — TÍNH từ dữ liệu từng-lượt (ai_generations),
 * KHÔNG lưu thêm 1 bộ đếm tổng riêng để tránh lệch/trôi so với dữ liệu gốc. Dùng cho admin
 * quan sát: tổng token theo user, theo provider, trung bình token/lượt sinh...
 * filters: { projectId?, requestedBy?, from?, to? } — bỏ trống filter nào thì không giới hạn theo đó.
 */
const getUsageStats = async (filters = {}) => {
  const match = {}

  if (filters.projectId) {
    ensureValidObjectId(filters.projectId, 'project id')
    match.projectId = new mongoose.Types.ObjectId(filters.projectId)
  }
  if (filters.requestedBy) {
    ensureValidObjectId(filters.requestedBy, 'user id')
    match.requestedBy = new mongoose.Types.ObjectId(filters.requestedBy)
  }
  if (filters.from || filters.to) {
    match.createdAt = {}
    if (filters.from) match.createdAt.$gte = new Date(filters.from)
    if (filters.to) match.createdAt.$lte = new Date(filters.to)
  }

  const [[overall], byProvider, byUser] = await Promise.all([
    AiGeneration.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalGenerations: { $sum: 1 },
          totalTokensUsed: { $sum: '$tokensUsed' },
          avgTokensPerGeneration: { $avg: '$tokensUsed' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
        },
      },
    ]),
    AiGeneration.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$provider',
          generations: { $sum: 1 },
          tokensUsed: { $sum: '$tokensUsed' },
          avgTokensUsed: { $avg: '$tokensUsed' },
        },
      },
      { $sort: { tokensUsed: -1 } },
    ]),
    AiGeneration.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$requestedBy',
          generations: { $sum: 1 },
          tokensUsed: { $sum: '$tokensUsed' },
          avgTokensUsed: { $avg: '$tokensUsed' },
        },
      },
      { $sort: { tokensUsed: -1 } },
    ]),
  ])

  return {
    totalGenerations: overall?.totalGenerations || 0,
    totalTokensUsed: overall?.totalTokensUsed || 0,
    avgTokensPerGeneration: overall?.avgTokensPerGeneration || 0,
    completedCount: overall?.completedCount || 0,
    failedCount: overall?.failedCount || 0,
    byProvider: byProvider.map((p) => ({
      provider: p._id,
      generations: p.generations,
      tokensUsed: p.tokensUsed,
      avgTokensUsed: p.avgTokensUsed,
    })),
    byUser: byUser.map((u) => ({
      userId: u._id,
      generations: u.generations,
      tokensUsed: u.tokensUsed,
      avgTokensUsed: u.avgTokensUsed,
    })),
  }
}

const getGeneration = async (generationId) => {
  ensureValidObjectId(generationId, 'generation id')

  const generation = await AiGeneration.findById(generationId).populate(SOURCE_EPIC_POPULATE).lean()
  if (!generation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Generation not found')
  }

  const drafts = await AiDraftIssue.find({ generationId }).sort({ createdAt: 1 }).lean()

  return { ...generation, drafts }
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

  const { title, description, type, priority, parentTempId } = body

  if (!title || !title.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Title là bắt buộc')
  }
  if (!DRAFT_TYPES.includes(type)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid type')
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

  await AiDraftIssue.deleteOne({ _id: draftId })
  return draft
}

const rejectDrafts = async (generationId, ids = []) => {
  ensureValidObjectId(generationId, 'generation id')

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'ids không được rỗng')
  }
  ids.forEach((id) => ensureValidObjectId(id, 'draft id'))

  await AiDraftIssue.updateMany(
    { _id: { $in: ids }, generationId, status: 'SUGGESTED' },
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

  const allDrafts = await AiDraftIssue.find({ generationId })
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
    } else if (generation.generationType === 'EPIC_TO_TASK') {
      parentIssueId = generation.sourceEntityId
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

export const aiGenerationService = {
  getAiUsageToday,
  createGeneration,
  clarifyRequirement,
  listGenerations,
  getGeneration,
  getUsageStats,
  editDraft,
  addManualDraft,
  deleteDraft,
  rejectDrafts,
  acceptDrafts,
}
