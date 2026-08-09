import api from '@/lib/api'

export interface PaymentOrderData {
  transactionId: string
  paymentCode: string
  amount: number
  qrUrl: string
  bankName: string
  bankAccount: string
  expiresAt: string
  isExistingOrder?: boolean
  expectedExpiresAt?: string
  currentPlan?: 'FREE' | 'PRO'
  currentPlanExpiresAt?: string | null
}

export interface PaymentStatusData {
  paymentCode: string
  status: 'PENDING' | 'PAID' | 'PARTIAL_PAID' | 'UNMATCHED' | 'CANCELLED'
  plan: 'FREE' | 'PRO'
  currentPlanExpiresAt: string | null
  expiresAt?: string
}

export interface UserTransactionHistoryItem {
  id: string
  paymentCode: string
  amount: number
  status: 'PENDING' | 'PAID' | 'PARTIAL_PAID' | 'UNMATCHED' | 'CANCELLED'
  resolutionStatus: 'AUTO' | 'MANUAL_PENDING' | 'RESOLVED_BY_ADMIN' | 'REJECTED'
  createdAt: string
  isManual: boolean
  referenceCode: string
}

export interface UserTransactionHistoryResponse {
  currentPlan: 'FREE' | 'PRO'
  currentPlanExpiresAt: string | null
  history: UserTransactionHistoryItem[]
}

export interface WebhookLogItem {
  _id: string
  resultStatus: 'MATCHED' | 'UNMATCHED' | 'FAILED_AUTH' | 'INVALID_DATA'
  amount: number
  contentRaw: string
  bankReferenceCode: string
  maskedAccountNumber: string
  accountName: string
  matchedTransactionId?: any
  createdAt: string
  note: string
}

export const paymentApi = {
  // Tạo đơn nâng cấp PRO & nhận VietQR URL (hoặc lấy lại đơn PENDING cũ còn hạn - BR-23)
  async createPaymentOrder(): Promise<PaymentOrderData> {
    const res = await api.post('/payments/create-order')
    return res.data.data
  },

  // Lấy đơn PENDING dở dang nếu có
  async getPendingOrder(): Promise<PaymentOrderData | null> {
    const res = await api.get('/payments/pending-order')
    return res.data.data
  },

  // Kiểm tra trạng thái đơn thanh toán (Polling)
  async checkPaymentStatus(paymentCode: string): Promise<PaymentStatusData> {
    const res = await api.get(`/payments/status/${paymentCode}`)
    return res.data.data
  },

  // Lấy lịch sử giao dịch cá nhân (PAY-05)
  async getMyTransactionHistory(): Promise<UserTransactionHistoryResponse> {
    const res = await api.get('/payments/history')
    return res.data.data
  },

  // ADMIN: Lấy danh sách đơn chờ xử lý thủ công (PAY-08, PAY-09)
  async getAdminPendingResolutions(): Promise<{ transactions: any[]; unhandledCount: number }> {
    const res = await api.get('/admin/payments/pending-resolutions')
    return res.data.data
  },

  // ADMIN: Lấy danh sách Webhook logs SePay (PAY-08)
  async getAdminWebhookLogs(resultStatus?: string): Promise<{ logs: WebhookLogItem[]; unmatchedCount: number }> {
    const res = await api.get('/admin/payments/webhook-logs', { params: { resultStatus } })
    return res.data.data
  },

  // ADMIN: Duyệt / Cấp / Gỡ PRO thủ công (PAY-09)
  async resolveTransactionManually(payload: {
    transactionId?: string
    userId: string
    daysToAdd: number
    adminNote: string
    referenceCode?: string
  }): Promise<any> {
    const txId = payload.transactionId || 'manual'
    const res = await api.post(`/admin/payments/${txId}/resolve`, payload)
    return res.data.data
  },

  // ADMIN: Tìm kiếm người dùng theo tên/email (PAY-09)
  async searchUsers(query: string): Promise<any[]> {
    const res = await api.get('/admin/payments/users/search', { params: { q: query } })
    return res.data.data
  },
}
