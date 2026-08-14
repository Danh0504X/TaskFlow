import { StatusCodes } from 'http-status-codes'
import AiGeneration from '../../../models/aiGenerations.js'
import AiDraftIssue from '../../../models/aiDraftIssues.js'
import Issue from '../../../models/issues.js'
import ApiError from '../../../utils/ApiError.js'
import { runAiGeneration, runAiClarify } from '../aiRunner.js'
import { aiEnv } from '../config/aiEnv.js'
import { DRAFT_PRIORITIES, ensureValidObjectId, resolveSessionGenerationIds } from './aiShared.util.js'

// Beta/Demo — AI Lab. Layered giống issueService.js: Routes -> Controllers -> Services -> Models,
// validate thủ công + ApiError (module này không dùng zod/validateMiddleware, theo đúng cách
// issue/sprint route hiện có đang làm — KHÔNG bịa quy ước mới).
//
// Chỉ lo vòng đời AiGeneration (tạo lượt sinh, chạy AI nền, đọc lịch sử). Vòng đời AiDraftIssue
// (sửa/thêm tay/xoá/duyệt/từ chối) nằm ở aiDraft.service.js — xem file đó cho phần "chấp nhận
// draft -> tạo issue thật".

const GENERATION_TYPES = ['REQ_TO_EPIC', 'EPIC_TO_TASK']

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

      // Task nháp CHƯA duyệt/đã duyệt từ các lượt "Sinh Task" TRƯỚC ĐÓ cho ĐÚNG epic này (1 epic
      // thật giờ gộp chung 1 "phiên" — xem resolveSessionGenerationIds) — chống trùng luôn với
      // đề xuất cũ, không chỉ với task thật, để bấm "sinh thêm" nhiều lần không lặp lại ý cũ.
      const existingDraftTasks = await AiDraftIssue.find({
        projectId: generation.projectId,
        parentIssueId: generation.sourceEntityId,
        status: { $ne: 'REJECTED' },
      })
        .select('title')
        .lean()

      context = {
        sourceEpic: { title: sourceEpic.title, description: sourceEpic.description },
        existingTitles: [...existingTasks, ...existingDraftTasks].map((t) => t.title),
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

export const aiGenerationService = {
  getAiUsageToday,
  createGeneration,
  clarifyRequirement,
  listGenerations,
  getGeneration,
}
