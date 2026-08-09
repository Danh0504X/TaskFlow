import mongoose from 'mongoose'

const upgradeTransactionSchema = new mongoose.Schema(
  {
    // ID của người dùng thực hiện giao dịch (có thể null nếu khách gõ sai mã CK)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },

    // Mã giao dịch thanh toán duy nhất (Ví dụ: TF10293)
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Số tiền cần thanh toán cho gói PRO (Ví dụ: 99000)
    amount: {
      type: Number,
      required: true,
    },

    // Trạng thái thanh toán
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL_PAID', 'UNMATCHED', 'CANCELLED'],
      default: 'PENDING',
    },

    // Trạng thái xử lý thủ công của Admin/CSKH khi có sự cố
    resolutionStatus: {
      type: String,
      enum: ['AUTO', 'MANUAL_PENDING', 'RESOLVED_BY_ADMIN', 'REJECTED'],
      default: 'AUTO',
    },

    // Admin/CSKH thực hiện duyệt đơn thủ công (nếu có)
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },

    // Ghi chú của CSKH khi duyệt thủ công
    adminNote: {
      type: String,
      default: '',
    },

    // Thời điểm Admin thực hiện duyệt thủ công
    resolvedAt: {
      type: Date,
      default: null,
    },

    // Dữ liệu nguyên văn log Webhook gửi về từ SePay (dùng phục vụ đối soát)
    sePayData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('UpgradeTransaction', upgradeTransactionSchema)
