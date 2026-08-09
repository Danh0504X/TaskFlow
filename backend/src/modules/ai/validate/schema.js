// Beta/Demo — AI Lab. Ràng buộc hình dạng output của AI bằng structured output của Gemini
// (generationConfig.responseSchema) — dùng đúng enum type Gemini yêu cầu ('OBJECT', 'STRING',
// 'ARRAY'...), viết tay thay vì import SchemaType từ @google/generative-ai để tránh phụ thuộc
// SDK ngay ở lớp schema thuần dữ liệu này (chỉ provider/aiProvider.js mới cần import SDK thật).
const draftItemSchema = (allowedTypes, domainKeys) => ({
  type: 'OBJECT',
  properties: {
    tempId: { type: 'STRING' },
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    type: { type: 'STRING', enum: allowedTypes },
    priority: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
    parentTempId: { type: 'STRING', nullable: true },
    scopePreview: { type: 'ARRAY', items: { type: 'STRING' } },
    sourceQuote: { type: 'STRING' },
    domainKey: { type: 'STRING', enum: [...domainKeys, 'custom'] },
  },
  required: ['tempId', 'title', 'description', 'type', 'priority', 'domainKey'],
})

/** Schema cho toàn bộ response: { issues: [...] }. */
export const buildResponseSchema = (generationType, domainKeys) => ({
  type: 'OBJECT',
  properties: {
    issues: {
      type: 'ARRAY',
      items: draftItemSchema(generationType === 'REQ_TO_EPIC' ? ['EPIC'] : ['TASK'], domainKeys),
    },
  },
  required: ['issues'],
})

// Stage A của REQ_TO_EPIC (xem aiRunner.js) — trích thực thể/tính năng trước khi gom epic.
const entityItemSchema = () => ({
  type: 'OBJECT',
  properties: {
    key: { type: 'STRING' },
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    sourceQuote: { type: 'STRING' },
  },
  required: ['key', 'name', 'description', 'sourceQuote'],
})

export const buildEntityExtractionSchema = () => ({
  type: 'OBJECT',
  properties: {
    entities: { type: 'ARRAY', items: entityItemSchema() },
  },
  required: ['entities'],
})

// AI hỏi làm rõ trước REQ_TO_EPIC (xem controllers/aiGeneration.controller.js clarifyRequirement).
const clarifyQuestionSchema = () => ({
  type: 'OBJECT',
  properties: {
    key: { type: 'STRING' },
    question: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['key', 'question', 'options'],
})

export const buildClarifyResponseSchema = () => ({
  type: 'OBJECT',
  properties: {
    questions: { type: 'ARRAY', items: clarifyQuestionSchema() },
  },
  required: ['questions'],
})
