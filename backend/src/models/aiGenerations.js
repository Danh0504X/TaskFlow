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

    // Epic nguồn khi generationType = EPIC_TO_TASK VÀ sourceKind = 'ISSUE'; null các trường hợp khác.
    sourceEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'issue',
      default: null,
    },

    // 'ISSUE' (mặc định, mọi doc cũ): epic nguồn là issue thật, dùng sourceEntityId như trước giờ.
    // 'DRAFT': epic nguồn là 1 AiDraftIssue CHƯA duyệt (dùng sourceDraftId) — cho phép PM sinh Task
    // ngay trong lúc epic còn là nháp, không phải đợi duyệt epic trước.
    sourceKind: {
      type: String,
      enum: ['ISSUE', 'DRAFT'],
      default: 'ISSUE',
    },

    // Epic nháp nguồn khi sourceKind = 'DRAFT'; null các trường hợp khác. Tách field riêng khỏi
    // sourceEntityId (thay vì dùng chung rồi đổi `ref` linh hoạt) để không phá SOURCE_EPIC_POPULATE
    // hiện đang populate cố định từ collection 'issue'.
    sourceDraftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ai_draft_issue',
      default: null,
    },

    // Tự tham chiếu — coi 1 chuỗi AiGeneration là 1 "phiên" (session): null = doc này CHÍNH LÀ
    // gốc phiên (mọi doc cũ tự thoả điều kiện này, không cần migrate); khác null = doc này là 1
    // lượt gọi AI con "thêm vào" phiên gốc đó (vd sinh Task cho 1 epic nháp thuộc phiên đang mở).
    // Luôn trỏ THẲNG về gốc (không lồng nhiều cấp) để việc gom draft theo phiên chỉ cần 1 query
    // $in phẳng, xem resolveSessionGenerationIds ở aiGeneration.service.js.
    parentGenerationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ai_generation',
      default: null,
      index: true,
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
