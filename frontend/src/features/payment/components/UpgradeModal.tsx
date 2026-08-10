import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  X,
  Zap,
  ShieldCheck,
  Crown,
} from 'lucide-react'
import { paymentApi, type PaymentOrderData } from '../payment.api'
import { useAuthStore } from '@/features/auth/authStore'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, setUser } = useAuthStore()
  const [order, setOrder] = useState<PaymentOrderData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'ERROR'>('PENDING')
  const [timeLeft, setTimeLeft] = useState<number>(300) // 5 phút đếm ngược
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [checkingNotice, setCheckingNotice] = useState<string | null>(null)

  // Khởi tạo đơn thanh toán VietQR khi mở Modal
  useEffect(() => {
    if (isOpen && !order) {
      initOrder()
    }
    if (!isOpen) {
      resetState()
    }
  }, [isOpen])

  // Logic Đếm ngược 5 phút
  useEffect(() => {
    if (!isOpen || paymentStatus === 'PAID' || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, paymentStatus, timeLeft])

  // Logic Polling tự động mỗi 3 giây kiểm tra Webhook SePay
  useEffect(() => {
    if (!isOpen || !order || paymentStatus === 'PAID') return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.checkPaymentStatus(order.paymentCode)
        // CHỈ công nhận khi đúng đơn này có status === 'PAID' (tránh bug account đã là PRO từ trước khi gia hạn)
        if (res.status === 'PAID') {
          setPaymentStatus('PAID')
          setCheckingNotice(null)
          // Cập nhật state User sang PRO trong Zustand store
          if (user) {
            setUser({
              ...user,
              plan: 'PRO',
              currentPlanExpiresAt: res.currentPlanExpiresAt,
            })
          }
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      } catch (err) {
        console.error('Polling status error:', err)
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [isOpen, order, paymentStatus, user, setUser])

  const initOrder = async () => {
    try {
      setLoading(true)
      const data = await paymentApi.createPaymentOrder()
      setOrder(data)
      setPaymentStatus('PENDING')
      setCheckingNotice(null)
      setTimeLeft(300)
    } catch (err) {
      console.error('Failed to create payment order:', err)
      setPaymentStatus('ERROR')
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setOrder(null)
    setPaymentStatus('PENDING')
    setCheckingNotice(null)
    setTimeLeft(300)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleManualCheck = async () => {
    if (!order) return
    setLoading(true)
    setCheckingNotice(null)
    try {
      const res = await paymentApi.checkPaymentStatus(order.paymentCode)
      if (res.status === 'PAID') {
        setPaymentStatus('PAID')
        if (user) {
          setUser({
            ...user,
            plan: 'PRO',
            currentPlanExpiresAt: res.currentPlanExpiresAt,
          })
        }
      } else if (res.status === 'PENDING') {
        setCheckingNotice(
          'Hệ thống chưa nhận được tiền từ SePay/ngân hàng. Vui lòng chờ 5 - 10 giây để hệ thống tự xử lý hoặc kiểm tra lại nội dung chuyển khoản!'
        )
      } else if (res.status === 'PARTIAL_PAID') {
        setCheckingNotice(
          'Hệ thống ghi nhận bạn đã chuyển thiếu tiền. Đơn hàng đã được ghi nhận vào danh sách hỗ trợ đối soát thủ công!'
        )
      } else if (res.status === 'CANCELLED') {
        setCheckingNotice(
          'Đơn hàng đã hết hạn giữ đơn (30 phút). Vui lòng tắt popup và bấm gia hạn lại đơn mới!'
        )
      }
    } catch (err) {
      console.error(err)
      setCheckingNotice('Không thể kiểm tra trạng thái giao dịch. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden text-ink"
        >
          {/* Header với Gradient PRO rực rỡ */}
          <div className="relative bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 p-6 border-b border-hairline">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-subtle hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-surface/50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Crown size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  Nâng cấp Tài khoản PRO
                  <span className="text-[10px] uppercase font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                    VIP
                  </span>
                </h3>
                <p className="text-xs text-subtle">
                  Mở khóa AI không giới hạn & các tính năng quản trị dự án cao cấp
                </p>
              </div>
            </div>
          </div>

          {/* Nội dung Modal */}
          <div className="p-6 space-y-6">
            {/* THÀNH CÔNG: Đã nhận tiền & nâng cấp PRO */}
            {paymentStatus === 'PAID' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-ink">Thanh toán Thành công! 🎉</h4>
                  <p className="text-sm text-subtle mt-1">
                    Tài khoản của bạn đã được nâng cấp lên gói <strong className="text-amber-500 font-semibold">PRO (30 Ngày)</strong>.
                  </p>
                </div>
                <div className="p-4 bg-canvas border border-hairline rounded-xl text-xs text-subtle max-w-md mx-auto space-y-1">
                  <p className="flex items-center justify-center gap-1 text-ink font-medium">
                    <Zap size={14} className="text-amber-500" /> Bạn hiện có thể tạo AI không giới hạn!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full max-w-xs py-2.5 bg-brand hover:bg-brand/90 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-brand/20 cursor-pointer"
                >
                  Bắt đầu trải nghiệm PRO ngay
                </button>
              </motion.div>
            ) : (
              /* ĐANG THANH TOÁN: Hiển thị VietQR */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Khung Mã QR */}
                <div className="flex flex-col items-center justify-center p-4 bg-canvas rounded-xl border border-hairline relative">
                  {loading || !order ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-subtle">
                      <RefreshCw size={24} className="animate-spin text-brand" />
                      <span className="text-xs">Đang tạo mã VietQR...</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative group">
                        <img
                          src={order.qrUrl}
                          alt="VietQR Payment Code"
                          className="w-52 h-52 object-contain rounded-lg border border-hairline bg-white p-2 shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none" />
                      </div>

                      <div className="mt-3 text-center">
                        <span className="text-[11px] text-subtle block">Thời gian giữ đơn</span>
                        <span className="text-sm font-mono font-bold text-amber-500">
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Khung Chi tiết Chuyển khoản */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-subtle block mb-1">Số tiền thanh toán</span>
                    <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <span className="text-lg font-bold text-amber-500">
                        {order?.amount.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-md">
                        30 Ngày PRO
                      </span>
                    </div>
                  </div>

                  {/* Thông tin Ngân hàng */}
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-subtle block mb-0.5">Ngân hàng thụ hưởng</span>
                      <span className="font-semibold text-ink text-sm">{order?.bankName || 'MBBank'}</span>
                    </div>

                    <div>
                      <span className="text-subtle block mb-0.5">Số tài khoản</span>
                      <div className="flex items-center justify-between p-2 bg-canvas border border-hairline rounded-lg">
                        <span className="font-mono font-semibold text-ink text-sm">
                          {order?.bankAccount}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order?.bankAccount || '', 'acc')}
                          className="p-1 text-subtle hover:text-brand transition-colors cursor-pointer"
                        >
                          {copiedField === 'acc' ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-subtle block mb-0.5">Nội dung chuyển khoản (Bắt buộc)</span>
                      <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm tracking-wider">
                          {order?.paymentCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order?.paymentCode || '', 'code')}
                          className="p-1 text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          {copiedField === 'code' ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái Polling live */}
                  <div className="pt-2 border-t border-hairline">
                    <div className="flex items-center gap-2 text-subtle mb-3">
                      <RefreshCw size={13} className="animate-spin text-brand" />
                      <span className="text-[11px]">
                        Hệ thống tự kiểm tra thanh toán mỗi 3 giây qua SePay...
                      </span>
                    </div>

                    {checkingNotice && (
                      <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {checkingNotice}
                      </div>
                    )}

                    <button
                      onClick={handleManualCheck}
                      disabled={loading}
                      className="w-full py-2 bg-brand/10 hover:bg-brand/20 text-brand font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck size={15} />
                      Tôi đã chuyển khoản thành công
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
