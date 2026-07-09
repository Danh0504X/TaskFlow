import mongoose from 'mongoose'

const projectMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER'],
      default: 'MEMBER',
    },

    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REMOVED'],
      default: 'ACTIVE',
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
)

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Mã ngắn của project (vd "WEB"), dùng làm tiền tố hiển thị issue (WEB-12).
    // Không bắt buộc phía client gửi lên -> service tự sinh từ name nếu thiếu.
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 10,
    },

    // Phương pháp quản trị, chọn 1 lần lúc tạo, không đổi được sau đó
    // (đổi giữa chừng phá vỡ cấu trúc Sprint/Backlog đã có của project).
    methodology: {
      type: String,
      enum: ['SCRUM', 'KANBAN'],
      required: true,
      default: 'KANBAN',
    },

    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },

    deadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [ 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },

    members: {
      type: [projectMemberSchema],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Không cho trùng userId trong members
projectSchema.pre('validate', function (next) {
  if (this.members && this.members.length > 0) {
    const userIds = this.members.map((member) => member.userId.toString())
    const uniqueUserIds = new Set(userIds)

    if (userIds.length !== uniqueUserIds.size) {
      this.invalidate('members', 'Project members cannot contain duplicate users')
    }
  }

  next()
})

// Index hỗ trợ query project nhanh hơn
projectSchema.index({ createdBy: 1, isDeleted: 1 })
projectSchema.index({ 'members.userId': 1 })
projectSchema.index({ status: 1, isDeleted: 1 })

const Project = mongoose.model('project', projectSchema)

export default Project