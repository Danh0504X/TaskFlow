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