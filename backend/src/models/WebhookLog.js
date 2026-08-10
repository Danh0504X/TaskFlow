import mongoose from 'mongoose'

const webhookLogSchema = new mongoose.Schema(
  {
    // Kết quả xử lý: MATCHED (Khớp đơn), UNMATCHED (Chưa/Không khớp), FAILED_AUTH (Sai auth token), INVALID_DATA (Dữ liệu không hợp lệ)
    resultStatus: {
      type: String,
      enum: ['MATCHED', 'UNMATCHED', 'FAILED_AUTH', 'INVALID_DATA'],
      required: true,
      index: true,
    },

    // Số tiền chuyển khoản
    amount: {
      type: Number,
      default: 0,
    },

    // Nội dung chuyển khoản gốc từ ngân hàng
    contentRaw: {
      type: String,
      default: '',
    },

    // Mã giao dịch/tham chiếu của ngân hàng (nếu có, e.g., referenceCode / transactionDate)
    bankReferenceCode: {
      type: String,
      default: '',
    },

    // Số tài khoản người gửi dạng đã che (BR-21, ví dụ: 098****123)
    maskedAccountNumber: {
      type: String,
      default: '',
    },

    // Tên tài khoản người gửi (nếu SePay gửi kèm)
    accountName: {
      type: String,
      default: '',
    },

    // Đơn hàng khớp tương ứng (nếu có)
    matchedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UpgradeTransaction',
      default: null,
    },

    // Toàn bộ payload nguyên văn của webhook
    payload: {
      type: Object,
      default: {},
    },

    // Ghi chú hệ thống / lý do xử lý
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('WebhookLog', webhookLogSchema)
