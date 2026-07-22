import mongoose from 'mongoose'

const sprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    goal: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNED',
      index: true,
    },

    orderIndex: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Mốc thời gian xóa mềm — khớp với `Project.deletedAt` khi bị cascade-xóa cùng project,
    // giúp phân biệt với sprint tự xóa riêng lẻ khi project được khôi phục.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Validate ngày kết thúc phải lớn hơn ngày bắt đầu
sprintSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be greater than start date')
  }

  next()
})

// Index giúp query sprint theo project nhanh hơn
sprintSchema.index({ projectId: 1, status: 1 })
sprintSchema.index({ projectId: 1, orderIndex: 1 })

// Chặn race-condition: mỗi project chỉ được có tối đa 1 sprint ACTIVE (chưa xóa mềm)
// tại một thời điểm, thực thi ở tầng DB thay vì chỉ dựa vào check read-then-write ở service.
// Không cần đưa "status" vào key vì partialFilterExpression đã cố định status = 'ACTIVE'
// trong tập document mà index này áp dụng, nên chỉ projectId là đủ để đảm bảo tính duy nhất.
sprintSchema.index(
  { projectId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE', isDeleted: false } },
)

const Sprint = mongoose.model('sprint', sprintSchema)

export default Sprint