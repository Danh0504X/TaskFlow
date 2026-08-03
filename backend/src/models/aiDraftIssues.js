import mongoose from 'mongoose'

// Beta/Demo — AI Lab. 1 doc = 1 epic/task AI (hoặc PM) đề xuất trong 1 lượt sinh,
// chờ PM duyệt trước khi hoá thành issue thật (models/issues.js — KHÔNG sửa file đó).
// Collection: ai_draft_issues (tự suy ra từ tên model 'ai_draft_issue').
const aiDraftIssueSchema = new mongoose.Schema(
  {
    generationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ai_generation',
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true,
    },

    // Nhãn tạm AI (hoặc PM khi thêm tay) gán, chỉ duy nhất TRONG 1 generation — dùng để nối
    // cha-con giữa các draft trước khi chúng được hoá thành issue thật (có _id riêng).
    tempId: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },

    type: {
      type: String,
      enum: ['EPIC', 'TASK'],
      required: true,
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },

    // Nối cha-con TRONG nháp — chỉ dùng ở REQ_TO_EPIC (Epic không có cha, Task trỏ về Epic
    // vừa sinh cùng mẻ). EPIC_TO_TASK không dùng field này vì cha đã là issue thật
    // (xem generation.sourceEntityId).
    parentTempId: {
      type: String,
      default: null,
    },

    // 3–8 dòng phạm vi do AI liệt kê — CHỈ hiển thị cho PM tham khảo, không thật hoá.
    scopePreview: {
      type: [String],
      default: [],
    },

    // Dẫn chứng trích từ requirement khi đây là 1 miền đặc thù (ngoài checklist chuẩn) —
    // xem modules/ai/config/domains.js.
    sourceQuote: {
      type: String,
      trim: true,
      default: '',
    },

    origin: {
      type: String,
      enum: ['AI', 'MANUAL'],
      default: 'AI',
    },

    status: {
      type: String,
      enum: ['SUGGESTED', 'ACCEPTED', 'REJECTED'],
      default: 'SUGGESTED',
      index: true,
    },

    createdIssueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'issue',
      default: null,
    },

    // Dọn draft chưa duyệt sau 7 ngày (TTL index bên dưới).
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
)

// Chỉ tự xoá draft còn SUGGESTED (chưa được PM duyệt) — ACCEPTED/REJECTED giữ lại vĩnh viễn
// làm lịch sử, tránh TTL xoá nhầm draft đã hoá thành issue thật.
aiDraftIssueSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'SUGGESTED' } },
)

const AiDraftIssue = mongoose.model('ai_draft_issue', aiDraftIssueSchema)

export default AiDraftIssue
