import { aiEnv } from '../config/aiEnv.js'
import { stubGenerateReqToEpic, stubGenerateEpicToTask } from './stubProvider.js'

// Beta/Demo — AI Lab. Adapter chuẩn hoá cho mọi provider: generateStructured(...) luôn trả
// { json, tokensUsed, provider, model }. `generationType`/`stubContext` chỉ được stub dùng
// (stub cần dữ liệu có cấu trúc gốc, không parse lại prompt dạng văn xuôi).

/** Ném khi package SDK của provider chưa được cài (chỉ @google/generative-ai được thêm mặc định)
 * — được bắt riêng để rơi về stub, PHÂN BIỆT với lỗi thật khi gọi API (network/timeout/parse) —
 * lỗi thật phải được ném tiếp lên để generation chuyển FAILED, không âm thầm đổi sang stub. */
class ProviderUnavailableError extends Error {}

let cachedGeminiClient = null

const callGemini = async ({ system, user, schema, temperature }) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')

  if (!cachedGeminiClient) {
    cachedGeminiClient = new GoogleGenerativeAI(aiEnv.GEMINI_API_KEY)
  }

  const model = cachedGeminiClient.getGenerativeModel({
    model: aiEnv.AI_MODEL,
    systemInstruction: system,
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })

  const text = result.response.text()
  const json = JSON.parse(text)
  const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0

  return { json, tokensUsed, provider: 'gemini', model: aiEnv.AI_MODEL }
}

// Chuyển schema nội bộ (kiểu Gemini: 'OBJECT'/'STRING'/'ARRAY'...) sang JSON Schema chuẩn cho
// response_format của OpenAI (strict json_schema cần additionalProperties:false ở mọi OBJECT).
const toJsonSchema = (node) => {
  if (node.type === 'OBJECT') {
    const properties = {}
    for (const [key, value] of Object.entries(node.properties || {})) {
      properties[key] = toJsonSchema(value)
    }
    return {
      type: 'object',
      properties,
      required: node.required || Object.keys(properties),
      additionalProperties: false,
    }
  }
  if (node.type === 'ARRAY') {
    return { type: 'array', items: toJsonSchema(node.items) }
  }
  const base = { type: node.type.toLowerCase() }
  if (node.enum) base.enum = node.enum
  if (node.nullable) base.type = [base.type, 'null']
  return base
}

const callOpenAi = async ({ system, user, schema, temperature }) => {
  let OpenAI
  try {
    ;({ default: OpenAI } = await import('openai'))
  } catch {
    throw new ProviderUnavailableError('Chưa cài package "openai"')
  }

  const client = new OpenAI({ apiKey: aiEnv.OPENAI_API_KEY })
  const completion = await client.chat.completions.create({
    model: aiEnv.AI_MODEL,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'ai_issue_batch', strict: true, schema: toJsonSchema(schema) },
    },
  })

  const text = completion.choices[0]?.message?.content || '{}'
  const json = JSON.parse(text)
  const tokensUsed = completion.usage?.total_tokens || 0

  return { json, tokensUsed, provider: 'openai', model: aiEnv.AI_MODEL }
}

const callAnthropic = async ({ system, user, schema, temperature }) => {
  let Anthropic
  try {
    ;({ default: Anthropic } = await import('@anthropic-ai/sdk'))
  } catch {
    throw new ProviderUnavailableError('Chưa cài package "@anthropic-ai/sdk"')
  }

  const client = new Anthropic({ apiKey: aiEnv.ANTHROPIC_API_KEY })
  const toolSchema = toJsonSchema(schema)
  const message = await client.messages.create({
    model: aiEnv.AI_MODEL,
    max_tokens: 4096,
    temperature,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [{ name: 'submit_issues', description: 'Trả kết quả issue đã sinh', input_schema: toolSchema }],
    tool_choice: { type: 'tool', name: 'submit_issues' },
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  const json = toolUse?.input || {}
  const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)

  return { json, tokensUsed, provider: 'anthropic', model: aiEnv.AI_MODEL }
}

/** Quyết định provider thật sự sẽ dùng: nếu thiếu API key tương ứng -> tự về 'stub' (demo vẫn chạy). */
const resolveProvider = () => {
  const configured = aiEnv.AI_PROVIDER

  if (configured === 'gemini' && !aiEnv.GEMINI_API_KEY) {
    console.warn('>> [aiProvider] Thiếu GEMINI_API_KEY -> dùng stub provider')
    return 'stub'
  }
  if (configured === 'openai' && !aiEnv.OPENAI_API_KEY) {
    console.warn('>> [aiProvider] Thiếu OPENAI_API_KEY -> dùng stub provider')
    return 'stub'
  }
  if (configured === 'anthropic' && !aiEnv.ANTHROPIC_API_KEY) {
    console.warn('>> [aiProvider] Thiếu ANTHROPIC_API_KEY -> dùng stub provider')
    return 'stub'
  }
  if (!['gemini', 'openai', 'anthropic', 'stub'].includes(configured)) {
    console.warn(`>> [aiProvider] AI_PROVIDER "${configured}" không hợp lệ -> dùng stub provider`)
    return 'stub'
  }
  return configured
}

const callStub = ({ generationType, stubContext }) => {
  const issues =
    generationType === 'REQ_TO_EPIC'
      ? stubGenerateReqToEpic(stubContext)
      : stubGenerateEpicToTask(stubContext)

  return Promise.resolve({
    json: { issues },
    tokensUsed: 0,
    provider: 'stub',
    model: 'stub-deterministic-v1',
  })
}

/**
 * generateStructured({system, user, schema, temperature, generationType, stubContext})
 * -> { json, tokensUsed, provider, model }
 *
 * `generationType` + `stubContext` (dữ liệu có cấu trúc gốc: inputPrompt/sourceEpic...) chỉ cần
 * khi provider thật sự dùng là 'stub' — các provider AI thật chỉ cần system/user/schema/temperature.
 */
export const generateStructured = async ({
  system,
  user,
  schema,
  temperature = 0.2,
  generationType,
  stubContext,
}) => {
  const provider = resolveProvider()

  if (provider === 'stub') {
    return callStub({ generationType, stubContext })
  }

  const callers = { gemini: callGemini, openai: callOpenAi, anthropic: callAnthropic }

  try {
    return await callers[provider]({ system, user, schema, temperature })
  } catch (error) {
    if (error instanceof ProviderUnavailableError) {
      console.warn(`>> [aiProvider] ${error.message} -> dùng stub provider`)
      return callStub({ generationType, stubContext })
    }
    // Lỗi thật khi gọi AI (network/timeout/parse...) -> ném tiếp để generation chuyển FAILED.
    throw error
  }
}
