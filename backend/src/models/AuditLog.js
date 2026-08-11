import mongoose from 'mongoose'
import { AUDIT_ACTION } from '../utils/constants.js'

const auditLogSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      default: 'System Admin',
    },
    adminEmail: {
      type: String,
      default: 'admin@gmail.com',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ACTION),
      index: true,
    },
    // Id của đối tượng bị tác động (vd User) — cho phép truy vết chính xác kể cả khi
    // targetLabel (email/tên) đã đổi sau đó. Không ràng buộc ref cố định vì đối tượng có
    // thể thuộc nhiều model khác nhau trong tương lai.
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
