import { StatusCodes } from 'http-status-codes'
import ApiError from '../../utils/ApiError.js'
import { generateStructured } from './provider/aiProvider.js'
import { buildPrompt } from './prompt/prompts.js'
import { buildResponseSchema } from './validate/schema.js'
import { validateDraftBatch } from './validate/rules.js'
import { AI_DOMAIN_KEYS } from './config/domains.js'

// Beta/Demo — AI Lab. Vòng generate -> validate -> (gửi lại lỗi cho AI) -> tối đa 2 lần.
// Hết vòng vẫn lỗi -> ném ApiError (service bắt lại, đánh dấu generation FAILED).
const MAX_ATTEMPTS = 2

export const runAiGeneration = async (generationType, context) => {
  let lastErrors = []
  // Cộng dồn token thật đã tiêu qua TỪNG attempt (kể cả attempt bị validate từ chối) — 1 lượt
  // sinh có thể gọi AI thật 1-2 lần, và mọi lần gọi đều tốn phí thật, không chỉ lần thắng cuộc.
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
      // Lỗi thật khi gọi AI (network/timeout/parse...) — không retry, nhưng vẫn giữ lại token
      // đã tiêu ở (các) attempt trước đó thay vì để mất dấu khi ném lỗi lên.
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
  // Hết lượt vẫn lỗi -> generation sẽ FAILED, nhưng token của các attempt đã gọi vẫn là chi phí
  // thật -> đính kèm để service ghi lại, không để biến mất.
  error.tokensUsed = totalTokensUsed
  error.provider = lastProvider
  error.model = lastModel
  throw error
}
