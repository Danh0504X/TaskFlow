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

/**
 * Gom 1 "phiên" (session) thành mảng generationId phẳng: [gốc phiên, ...các turn con] — nhận
 * vào generationId BẤT KỲ (gốc hoặc 1 turn con) đều ra đúng cùng 1 tập. Dùng ở mọi nơi cần đọc/
 * ghi draft theo phạm vi cả phiên (getGeneration/acceptDrafts/rejectDrafts/deleteDraft) thay vì
 * chỉ theo đúng 1 generationId như trước — xem parentGenerationId ở models/aiGenerations.js.
 */
const resolveSessionGenerationIds = async (generationId) => {
  const doc = await AiGeneration.findById(generationId).select('parentGenerationId').lean()
  if (!doc) return [generationId]

  const rootId = doc.parentGenerationId ? doc.parentGenerationId.toString() : generationId.toString()
  const turns = await AiGeneration.find({ parentGenerationId: rootId }).select('_id').lean()

  return [rootId, ...turns.map((t) => t._id.toString())]
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
    // Chỉ có giá trị khi sourceKind='DRAFT' — ép cứng parentTempId của MỌI task sinh ra ở turn
    // này, không tin AI tự lặp lại đúng (server đã biết chắc chỉ có 1 epic cha cho cả turn).
    let forcedParentTempId = null

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
    } else if (generation.sourceKind === 'DRAFT') {
      const sourceDraft = await AiDraftIssue.findById(generation.sourceDraftId).lean()

      if (!sourceDraft || sourceDraft.status !== 'SUGGESTED') {
        throw new Error('Epic nháp nguồn đã bị xoá/duyệt/từ chối trong lúc xử lý')
      }

      // Task đã đề xuất cho ĐÚNG epic này (nếu PM từng bấm sinh task 2 lần) — chống trùng, không
      // cần lọc theo generationId vì tempId đã unique toàn cục (xem namespaceTempId bên dưới).
      const existingSiblingTasks = await AiDraftIssue.find({
        projectId: generation.projectId,
        parentTempId: sourceDraft.tempId,
        status: { $ne: 'REJECTED' },
      })
        .select('title')
        .lean()

      context = {
        sourceEpic: {
          title: sourceDraft.title,
          description: sourceDraft.description,
          // Phạm vi AI đã đề xuất lúc sinh epic — CHỈ tham khảo, không ép mỗi dòng phải ra đúng
          // 1 task (xem buildEpicToTaskUserPrompt). Rỗng với epic thêm tay (origin=MANUAL).
          scopePreview: sourceDraft.scopePreview || [],
        },
        existingTitles: existingSiblingTasks.map((t) => t.title),
      }
      forcedParentTempId = sourceDraft.tempId
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

    // Namespace tempId theo turn hiện tại (dùng chính _id thật, luôn unique) — chống đụng độ khi
    // nhiều turn khác nhau cùng gom draft vào 1 phiên (vd 2 epic cùng sinh task, AI ở cả 2 turn
    // đều có thể tự trả "T1","T2"...). Áp dụng cho MỌI loại turn, không riêng EPIC_TO_TASK, để
    // triệt để tránh bug đụng độ tempId — xem review đã thống nhất trước khi implement.
    const namespaceTempId = (id) => (id ? `${generation._id}:${id}` : null)

    const draftDocs = items.map((item) => ({
      generationId: generation._id,
      projectId: generation.projectId,
      tempId: namespaceTempId(item.tempId),
      title: item.title,
      description: item.description || '',
      type: item.type,
      priority: DRAFT_PRIORITIES.includes(item.priority) ? item.priority : 'MEDIUM',
      parentTempId: forcedParentTempId || namespaceTempId(item.parentTempId),
      // Epic THẬT nguồn: biết chắc cha ngay lúc này -> ghi thẳng, accept sau này chỉ cần đọc
      // field này, không phải tra ngược generation.generationType/sourceEntityId nữa.
      parentIssueId:
        generation.sourceKind === 'ISSUE' && generation.generationType === 'EPIC_TO_TASK'
          ? generation.sourceEntityId
          : null,
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

  const { generationType, sourceEntityId, sourceDraftId, parentGenerationId, inputPrompt, clarifications } = body

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

  // sourceKind quyết định nguồn epic: 'ISSUE' (issue thật, như cũ) hoặc 'DRAFT' (epic nháp CHƯA
  // duyệt, sinh Task ngay trong lúc PM đang xem lại lượt Sinh Epic — không phải đợi duyệt epic).
  let sourceKind = 'ISSUE'

  if (generationType === 'EPIC_TO_TASK') {
    if (!sourceEntityId && !sourceDraftId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'sourceEntityId hoặc sourceDraftId là bắt buộc cho EPIC_TO_TASK')
    }
    if (sourceEntityId && sourceDraftId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được chọn 1 nguồn: sourceEntityId hoặc sourceDraftId')
    }

    if (sourceDraftId) {
      sourceKind = 'DRAFT'
      ensureValidObjectId(sourceDraftId, 'source draft id')

      if (!parentGenerationId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'parentGenerationId is required when sourceDraftId is provided')
      }
      ensureValidObjectId(parentGenerationId, 'parent generation id')

      const sourceDraft = await AiDraftIssue.findOne({
        _id: sourceDraftId,
        projectId,
        type: 'EPIC',
        status: 'SUGGESTED',
      }).lean()

      if (!sourceDraft) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'Epic nháp nguồn không tồn tại hoặc không còn ở trạng thái chờ duyệt',
        )
      }

      // Phiên chỉ sâu đúng 1 cấp (xem parentGenerationId ở models/aiGenerations.js) — bắt buộc
      // trỏ thẳng tới gốc phiên (parentGenerationId của chính gốc luôn null), không cho lồng
      // phiên trong phiên.
      const session = await AiGeneration.findOne({
        _id: parentGenerationId,
        projectId,
        parentGenerationId: null,
      }).lean()

      if (!session) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Phiên (generation gốc) không tồn tại')
      }
    } else {
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
  }

  // Rate limit hằng ngày đã được chặn ở middleware checkAiLimit trên route POST .../generations
  // (xem backend/src/middlewares/checkAiLimit.js) — không kiểm lại ở đây nữa. Turn nào cũng vẫn
  // tạo 1 AiGeneration đầy đủ như trước (kể cả khi sourceKind='DRAFT') nên tính quota/token/audit
  // không bị thủng — chỉ khác là gắn thêm parentGenerationId để biết nó thuộc phiên nào.
  const generation = await AiGeneration.create({
    projectId,
    requestedBy,
    generationType,
    sourceKind: generationType === 'EPIC_TO_TASK' ? sourceKind : 'ISSUE',
    sourceEntityId: generationType === 'EPIC_TO_TASK' && sourceKind === 'ISSUE' ? sourceEntityId : null,
    sourceDraftId: sourceKind === 'DRAFT' ? sourceDraftId : null,
    parentGenerationId: sourceKind === 'DRAFT' ? parentGenerationId : null,
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

  // Trả draft của CẢ PHIÊN (gốc + mọi turn con), không chỉ riêng generationId được truyền vào —
  // dù gọi bằng id gốc hay id 1 turn con đều thấy đúng 1 cây draft đầy đủ. `generation` ở trên
  // vẫn là đúng doc được yêu cầu (status/error của riêng nó, dùng để FE biết turn đang poll đã
  // xong chưa) — chỉ có `drafts` mới gộp theo phạm vi phiên.
  const sessionGenerationIds = await resolveSessionGenerationIds(generationId)
  const drafts = await AiDraftIssue.find({ generationId: { $in: sessionGenerationIds } })
    .sort({ createdAt: 1 })
    .lean()

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
