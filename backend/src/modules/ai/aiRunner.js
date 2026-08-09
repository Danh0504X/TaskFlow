import { StatusCodes } from 'http-status-codes'
import ApiError from '../../utils/ApiError.js'
import { generateStructured } from './provider/aiProvider.js'
import { buildPrompt, buildEntityExtractionPrompt, buildClarifyPrompt } from './prompt/prompts.js'
import { buildResponseSchema, buildEntityExtractionSchema, buildClarifyResponseSchema } from './validate/schema.js'
import { validateDraftBatch, validateEntityBatch, validateClarifyQuestions } from './validate/rules.js'
import { AI_DOMAIN_KEYS } from './config/domains.js'

// Beta/Demo — AI Lab. Vòng generate -> validate -> (gửi lại lỗi cho AI) -> tối đa 2 lần.
// Hết vòng vẫn lỗi -> ném ApiError (service bắt lại, đánh dấu generation FAILED).
const MAX_ATTEMPTS = 2

// Stage A của REQ_TO_EPIC: trích thực thể/tính năng từ requirement TRƯỚC khi gom epic (lệnh gọi
// AI riêng — xem prompt/prompts.js buildEntityExtractionPrompt). Tách khỏi runEpicOrTaskStage để
// có thể chặn sớm: Stage A thất bại thì dừng ngay, không tốn thêm 1 lệnh gọi AI vô ích cho Stage B.
const runEntityExtractionStage = async (context) => {
  let lastErrors = []
  let totalTokensUsed = 0
  let lastProvider = null
  let lastModel = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { system, user } = buildEntityExtractionPrompt(context, lastErrors)
    const schema = buildEntityExtractionSchema()

    let callResult
    try {
      callResult = await generateStructured({
        system,
        user,
        schema,
        temperature: 0.2,
        generationType: 'ENTITY_EXTRACTION',
        stubContext: context,
      })
    } catch (error) {
      error.tokensUsed = totalTokensUsed
      error.provider = lastProvider
      error.model = lastModel
      throw error
    }

    const { json, tokensUsed, provider, model } = callResult
    totalTokensUsed += tokensUsed || 0
    lastProvider = provider
    lastModel = model

    const entities = Array.isArray(json?.entities) ? json.entities : []
    const errors = validateEntityBatch(entities)

    if (errors.length === 0) {
      return { entities, tokensUsed: totalTokensUsed, provider, model }
    }
    lastErrors = errors
  }

  const error = new ApiError(
    StatusCodes.BAD_GATEWAY,
    `AI không trích được thực thể hợp lệ sau ${MAX_ATTEMPTS} lần thử: ${lastErrors.join('; ')}`,
  )
  error.tokensUsed = totalTokensUsed
  error.provider = lastProvider
  error.model = lastModel
  throw error
}

// Gom epic (REQ_TO_EPIC, dùng entities của Stage A) hoặc bóc task (EPIC_TO_TASK, 1 stage duy
// nhất như trước giờ) — cùng 1 vòng generate -> validate -> retry.
const runEpicOrTaskStage = async (generationType, context) => {
  let lastErrors = []
  let totalTokensUsed = 0
  let lastProvider = null
  let lastModel = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { system, user } = buildPrompt(generationType, context, lastErrors)
    const schema = buildResponseSchema(generationType, AI_DOMAIN_KEYS)

    let callResult
    try {
      callResult = await generateStructured({
        system,
        user,
        schema,
        temperature: 0.2,
        generationType,
        stubContext: context,
      })
    } catch (error) {
      error.tokensUsed = totalTokensUsed
      error.provider = lastProvider
      error.model = lastModel
      throw error
    }

    const { json, tokensUsed, provider, model } = callResult
    totalTokensUsed += tokensUsed || 0
    lastProvider = provider
    lastModel = model

    const items = Array.isArray(json?.issues) ? json.issues : []
    const errors = validateDraftBatch(items, generationType, {
      existingTitles: context.existingTitles || [],
      domainKeys: AI_DOMAIN_KEYS,
    })

    if (errors.length === 0) {
      return { items, tokensUsed: totalTokensUsed, provider, model, rawOutput: json }
    }
    lastErrors = errors
  }

  const error = new ApiError(
    StatusCodes.BAD_GATEWAY,
    `AI không tạo được kết quả hợp lệ sau ${MAX_ATTEMPTS} lần thử: ${lastErrors.join('; ')}`,
  )
  error.tokensUsed = totalTokensUsed
  error.provider = lastProvider
  error.model = lastModel
  throw error
}

/**
 * REQ_TO_EPIC: 2 lệnh gọi AI tách biệt (Stage A trích thực thể -> Stage B gom epic từ đúng
 * entities đã xác nhận). EPIC_TO_TASK: giữ nguyên 1 lệnh gọi như trước (epic nguồn đã là dữ liệu
 * có cấu trúc — title + description — không cần trích thực thể riêng).
 */
export const runAiGeneration = async (generationType, context) => {
  if (generationType === 'EPIC_TO_TASK') {
    const result = await runEpicOrTaskStage(generationType, context)
    return { ...result, entities: [] }
  }

  const stageA = await runEntityExtractionStage(context)

  try {
    const stageB = await runEpicOrTaskStage(generationType, { ...context, entities: stageA.entities })
    return {
      ...stageB,
      entities: stageA.entities,
      tokensUsed: stageA.tokensUsed + stageB.tokensUsed,
    }
  } catch (error) {
    // Stage B lỗi (hết retry hoặc lỗi gọi AI thật) -> cộng dồn cả token Stage A đã tiêu, tránh
    // mất dấu chi phí thật của lệnh gọi đầu (xem service.js runWorker phần lưu error.tokensUsed).
    error.tokensUsed = (error.tokensUsed || 0) + stageA.tokensUsed
    throw error
  }
}

/**
 * AI hỏi làm rõ trước khi PM tạo lượt REQ_TO_EPIC thật (xem clarifyRequirement trong
 * aiGeneration.service.js). Chỉ 1 lệnh gọi, không retry nhiều lần — đây là bước phụ trợ nhẹ,
 * sai định dạng thì báo lỗi luôn thay vì tốn thêm token thử lại.
 */
export const runAiClarify = async (inputPrompt) => {
  const { system, user } = buildClarifyPrompt(inputPrompt)
  const schema = buildClarifyResponseSchema()

  let callResult
  try {
    callResult = await generateStructured({
      system,
      user,
      schema,
      temperature: 0.2,
      generationType: 'CLARIFY',
      stubContext: { inputPrompt },
    })
  } catch (error) {
    error.tokensUsed = error.tokensUsed || 0
    throw error
  }

  const { json, tokensUsed, provider, model } = callResult
  const questions = Array.isArray(json?.questions) ? json.questions : []
  const errors = validateClarifyQuestions(questions)

  if (errors.length > 0) {
    const error = new ApiError(StatusCodes.BAD_GATEWAY, `AI trả về câu hỏi không hợp lệ: ${errors.join('; ')}`)
    error.tokensUsed = tokensUsed
    error.provider = provider
    error.model = model
    throw error
  }

  return { questions, tokensUsed, provider, model }
}
