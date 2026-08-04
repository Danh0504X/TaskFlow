import api from '@/lib/api'

export interface PaymentOrderData {
  transactionId: string
  paymentCode: string
  amount: number
  qrUrl: string
  bankName: string
  bankAccount: string
}

export interface PaymentStatusData {
  paymentCode: string
  status: 'PENDING' | 'PAID' | 'PARTIAL_PAID' | 'UNMATCHED' | 'CANCELLED'
  plan: 'FREE' | 'PRO'
  currentPlanExpiresAt: string | null
}

export const paymentApi = {
  // Tạo đơn nâng cấp PRO & nhận VietQR URL
  async createPaymentOrder(): Promise<PaymentOrderData> {
    const res = await api.post('/payments/create-order')
    return res.data.data
  },

  // Kiềm tra trạng thái đơn thanh toán (Polling)
  async checkPaymentStatus(paymentCode: string): Promise<PaymentStatusData> {
    const res = await api.get(`/payments/status/${paymentCode}`)
    return res.data.data
  },
}
