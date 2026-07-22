import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true,
      index: true,
    },

    // Số thứ tự issue trong project (tự tăng, xem Project.issueSeq) -> ghép với
    // project.key để hiển thị mã issue dạng "PROJ-12".
    issueNumber: {
      type: Number,
      required: true,
    },

    parentIssueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'issue',
      default: null,
      index: true,
    },

    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'sprint',
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ['EPIC', 'TASK', 'SUBTASK', 'BUG'],
      default: 'TASK',
      index: true,
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

    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      default: 'TODO',
      index: true,
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    orderIndex: {
      type: Number,
      default: 0,
    },

    aiGenerated: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Mốc thời gian xóa mềm — khớp với `Project.deletedAt` khi bị cascade-xóa cùng project,
    // giúp phân biệt với issue tự xóa riêng lẻ khi project được khôi phục.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Không cho issue tự làm parent của chính nó
issueSchema.pre('validate', function (next) {
  if (
    this.parentIssueId &&
    this._id &&
    this.parentIssueId.toString() === this._id.toString()
  ) {
    this.invalidate('parentIssueId', 'Issue cannot be parent of itself')
  }

  next()
})

// Index hỗ trợ query trong project
issueSchema.index({ projectId: 1, issueNumber: 1 }, { unique: true })
issueSchema.index({ projectId: 1, sprintId: 1 })
issueSchema.index({ projectId: 1, status: 1 })
issueSchema.index({ projectId: 1, type: 1 })
issueSchema.index({ projectId: 1, parentIssueId: 1 })
issueSchema.index({ projectId: 1, sprintId: 1, status: 1, orderIndex: 1 })
issueSchema.index({ projectId: 1, isDeleted: 1 })

const Issue = mongoose.model('issue', issueSchema)

export default Issue