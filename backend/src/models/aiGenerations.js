import mongoose from 'mongoose'

// Beta/Demo — AI Lab. 1 doc = 1 lượt PM bấm "Sinh Epic"/"Sinh Task".
// Collection: ai_generations (tự suy ra từ tên model 'ai_generation', xem models/issues.js).
const aiGenerationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // CLARIFY: lượt AI hỏi làm rõ trước khi PM tạo lượt REQ_TO_EPIC thật — xử lý đồng bộ,
    // không tạo AiDraftIssue, nhưng vẫn tính vào quota checkAiLimit (đếm chung AiGeneration).
    generationType: {
      type: String,
      enum: ['REQ_TO_EPIC', 'EPIC_TO_TASK', 'CLARIFY'],
      required: true,
    },

    // Epic nguồn khi generationType = EPIC_TO_TASK; null khi REQ_TO_EPIC.
    sourceEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'issue',
      default: null,
    },

    inputPrompt: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    // Câu trả lời đóng (select/checkbox) PM chọn kèm requirement — dạng tự do, AI runner tự đọc.
    clarifications: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },

    provider: {
      type: String,
      default: null,
    },

    model: {
      type: String,
      default: null,
    },

    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    tokensUsed: {
      type: Number,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: null,
    },

    // Kết quả bước trích thực thể/tính năng (Stage A của REQ_TO_EPIC, xem aiRunner.js) — lưu lại
    // để PM/dev xem AI đã hiểu requirement thành những thực thể gì trước khi thấy epic. Rỗng với
    // EPIC_TO_TASK/CLARIFY.
    extractedEntities: {
      type: [
        {
          _id: false,
          key: String,
          name: String,
          description: String,
          sourceQuote: String,
        },
      ],
      default: [],
    },

    // Câu hỏi làm rõ do AI sinh khi generationType='CLARIFY' — PM trả lời rồi gửi lại dưới dạng
    // `clarifications` ở lượt REQ_TO_EPIC thật (field clarifications ở trên).
    clarifyingQuestions: {
      type: [
        {
          _id: false,
          key: String,
          question: String,
          options: [String],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

aiGenerationSchema.index({ projectId: 1, createdAt: -1 })
// Đếm số lượt sinh trong ngày của 1 user — dùng cho rate limit 15 lượt/ngày.
aiGenerationSchema.index({ requestedBy: 1, createdAt: -1 })

const AiGeneration = mongoose.model('ai_generation', aiGenerationSchema)

export default AiGeneration
