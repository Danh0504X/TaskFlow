import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'INVITATION',
        'SPRINT_STARTED',
        'SPRINT_COMPLETED',
        'TASK_ASSIGNED',
        'MENTIONED',
        'AI_COMPLETED',
        'TASK_REJECTED',
        'TASK_COMMENTED',
        'TASK_IN_REVIEW',
        'TASK_APPROVED',
        'MEMBER_LEFT',
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['PROJECT', 'SPRINT', 'ISSUE'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // TTL 30 days
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

const Notification = mongoose.model('notification', notificationSchema)

export default Notification
