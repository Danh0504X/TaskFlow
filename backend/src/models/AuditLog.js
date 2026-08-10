import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      default: 'System Admin',
    },
    adminEmail: {
      type: String,
      default: 'admin@gmail.com',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetLabel: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('AuditLog', auditLogSchema)
