import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Crown,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { paymentApi, type UserTransactionHistoryItem } from '../payment.api'

interface PaymentHistoryTabProps {
  onOpenPricing: () => void
}

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ onOpenPricing }) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'PRO'>('FREE')
  const [currentPlanExpiresAt, setCurrentPlanExpiresAt] = useState<string | null>(null)
  const [history, setHistory] = useState<UserTransactionHistoryItem[]>([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await paymentApi.getMyTransactionHistory()
      setCurrentPlan(data.currentPlan)
      setCurrentPlanExpiresAt(data.currentPlanExpiresAt)
      setHistory(data.history || [])
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
    } finally {
      setLoading(false)
    }
  }

  const isPro = currentPlan === 'PRO' && currentPlanExpiresAt && new Date(currentPlanExpiresAt) > new Date()

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderStatusBadge = (status: string, resStatus: string) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 size={12} /> Đã thanh toán {resStatus === 'RESOLVED_BY_ADMIN' && '(Duyệt thủ công)'}
        </span>
      )
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          <Clock size={12} /> Chờ thanh toán
        </span>
      )
    }
    if (status === 'PARTIAL_PAID' || status === 'UNMATCHED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
          <AlertCircle size={12} /> Cần đối soát (Chờ Admin)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-subtle bg-canvas border border-hairline px-2.5 py-0.5 rounded-full">
        <XCircle size={12} /> Đã hủy / Quá hạn
      </span>
    )
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-subtle">
        <RefreshCw size={24} className="animate-spin text-brand" />
        <span className="text-xs">Đang tải lịch sử giao dịch...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-ink">
      {/* Khung Thông tin Gói Hiện Tại (PAY-05 item 3) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Crown size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Gói tài khoản hiện tại:</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isPro ? 'bg-amber-500 text-white' : 'bg-canvas border border-hairline text-subtle'}`}>
                {isPro ? 'GÓI PRO (VIP)' : 'GÓI FREE'}
              </span>
            </div>
            <p className="text-xs text-subtle mt-0.5 flex items-center gap-1">
              <Calendar size={13} className="text-amber-500" />
              {isPro ? (
                <span>Ngày hết hạn gói PRO: <strong className="text-ink font-semibold">{formatDate(currentPlanExpiresAt)}</strong></span>
              ) : (
                <span>Không giới hạn thời gian. Nâng cấp PRO để sử dụng AI không giới hạn!</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPricing}
          className="py-2 px-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          {isPro ? 'Gia hạn gói PRO' : 'Nâng cấp lên PRO'}
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Danh sách Lịch sử Giao dịch (PAY-05 items 1, 2, 4, 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <CreditCard size={16} className="text-brand" /> Lịch Sử Giao Dịch
          </h4>
          <span className="text-xs text-subtle">Tổng số: {history.length} đơn</span>
        </div>

        {history.length === 0 ? (
          /* TRẠNG THÁI RỖNG (PAY-05 item 5) */
          <div className="py-12 px-4 text-center border border-dashed border-hairline rounded-2xl bg-canvas space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface border border-hairline flex items-center justify-center mx-auto text-subtle">
              <CreditCard size={24} />
            </div>
            <div>
              <h5 className="font-semibold text-sm">Chưa có giao dịch nào</h5>
              <p className="text-xs text-subtle mt-1">Bạn chưa thực hiện đơn thanh toán nào tại TaskFlow.</p>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
            >
              Khám phá Bảng Giá & Nâng Cấp ngay
            </button>
          </div>
        ) : (
          /* BẢNG LỊCH SỬ GIAO DỊCH */
          <div className="border border-hairline rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-subtle uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 font-semibold">Mã đơn hàng</th>
                    <th className="p-3 font-semibold">Gói dịch vụ</th>
                    <th className="p-3 font-semibold">Số tiền</th>
                    <th className="p-3 font-semibold">Thời điểm tạo</th>
                    <th className="p-3 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {history.filter((tx) => tx.status !== 'PENDING').map((tx) => (
                    <tr key={tx.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {tx.paymentCode}
                      </td>
                      <td className="p-3 font-medium">Gói PRO (30 Ngày)</td>
                      <td className="p-3 font-semibold text-ink">
                        {tx.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 text-subtle">{formatDate(tx.createdAt)}</td>
                      <td className="p-3">{renderStatusBadge(tx.status, tx.resolutionStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
