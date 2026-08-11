import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertCircle,
  Clock,
  HelpCircle,
  Info,
} from 'lucide-react'
import { paymentApi, type PaymentOrderData } from '../payment.api'
import { useAuthStore } from '@/features/auth/authStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, setUser } = useAuthStore()
  const [order, setOrder] = useState<PaymentOrderData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'ERROR'>('PENDING')

  // Đếm ngược 30 phút (1800 giây - BR-19)
  const [timeLeft, setTimeLeft] = useState<number>(1800)
  // Thời gian đã trôi qua kể từ khi mở màn hình thanh toán (để hiện cảnh báo 2 phút - PAY-04)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  // Thông báo phản hồi sau khi bấm "Tôi đã chuyển khoản thành công" (PENDING/PARTIAL_PAID/CANCELLED)
  const [checkingNotice, setCheckingNotice] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mở modal -> Tạo/lấy lại đơn thanh toán VietQR
  useEffect(() => {
    if (isOpen && !order) {
      initOrder()
    }
    if (!isOpen) {
      resetState()
    }
  }, [isOpen])

  // Logic Đếm ngược 30 phút và đếm elapsed 2 phút
  useEffect(() => {
    if (!isOpen || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED') return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus('EXPIRED')
          return 0
        }
        return prev - 1
      })
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, paymentStatus])

  // Logic Polling tự động kiểm tra Webhook SePay mỗi 3 giây
  // Tự động tạm dừng khi tab bị ẩn (PAY-04 item 4)
  useEffect(() => {
    if (!isOpen || !order || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED') return

    const runPolling = async () => {
      // Nhỡ tab bị ẩn -> tạm dừng polling tiết kiệm tài nguyên
      if (document.visibilityState === 'hidden') return

      try {
        const res = await paymentApi.checkPaymentStatus(order.paymentCode)
        // CHỈ công nhận khi đúng đơn này có status === 'PAID' (tránh bug account đã là PRO từ trước khi gia hạn)
        if (res.status === 'PAID') {
          setPaymentStatus('PAID')
          setCheckingNotice(null)
          if (user) {
            setUser({
              ...user,
              plan: 'PRO',
              currentPlanExpiresAt: res.currentPlanExpiresAt,
            })
          }
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (res.status === 'CANCELLED') {
          setPaymentStatus('EXPIRED')
        }
      } catch (err) {
        console.error('Polling payment error:', err)
      }
    }

    pollingRef.current = setInterval(runPolling, 3000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runPolling()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOpen, order, paymentStatus, user, setUser])

  const initOrder = async () => {
    try {
      setLoading(true)
      const data = await paymentApi.createPaymentOrder()
      setOrder(data)
      setPaymentStatus('PENDING')
      setCheckingNotice(null)

      // Đặt số giây đếm ngược theo expiresAt thực tế từ backend
      if (data.expiresAt) {
        const expireMs = new Date(data.expiresAt).getTime()
        const nowMs = Date.now()
        const remainSec = Math.max(0, Math.floor((expireMs - nowMs) / 1000))
        setTimeLeft(remainSec)
      } else {
        setTimeLeft(1800)
      }
      setElapsedSeconds(0)
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
    setTimeLeft(1800)
    setElapsedSeconds(0)
    setCheckingNotice(null)
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isPro ? 'Gia hạn gói PRO (+30 ngày)' : 'Nâng cấp tài khoản PRO'}
      tone="premium"
      layout="wide"
    >
      <p className="text-xs text-subtle -mt-1 mb-5">
        {isPro
          ? 'Thời hạn mới sẽ được cộng dồn nối tiếp vào ngày hết hạn cũ.'
          : 'Mở khóa AI không giới hạn lượt tạo & công cụ nâng cao.'}
      </p>

      {/* Banner Nhắc Nhở Đơn Cũ (PAY-03 item 5 - BR-23) */}
      {order?.isExistingOrder && paymentStatus === 'PENDING' && (
        <div className="mb-5 px-3.5 py-2 rounded-lg bg-pastel-yellow text-pastel-yellow-ink flex items-center gap-2 text-xs">
          <Info size={14} className="shrink-0" />
          <span>Đang hiển thị mã đơn thanh toán chưa hoàn tất trước đó của bạn.</span>
        </div>
      )}

      {/* TRẠNG THÁI: THANH TOÁN THÀNH CÔNG */}
      {paymentStatus === 'PAID' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-6 text-center space-y-4"
        >
          <div className="w-16 h-16 bg-pastel-green text-pastel-green-ink rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-ink">Thanh toán thành công!</h4>
            <p className="text-sm text-subtle mt-1">
              Tài khoản của bạn đã được nâng cấp lên gói <strong className="text-ink font-semibold">PRO (30 ngày)</strong>.
            </p>
          </div>
          <div className="p-4 bg-canvas border border-hairline rounded-lg text-xs text-subtle max-w-md mx-auto space-y-1.5 text-left">
            <p className="flex items-center gap-1.5 text-ink font-semibold">
              <Zap size={14} className="text-pastel-yellow-ink" /> Quyền lợi PRO đã sẵn sàng:
            </p>
            <p>• Bạn hiện có thể tạo Issue & Sprint bằng AI không giới hạn!</p>
            <p>• Email xác nhận thanh toán đã được gửi tới hộp thư của bạn.</p>
          </div>
          <Button onClick={onClose} className="w-full max-w-xs mx-auto">
            Bắt đầu sử dụng AI ngay
          </Button>
        </motion.div>
      ) : paymentStatus === 'EXPIRED' ? (
        /* TRẠNG THÁI: ĐƠN HẾT HẠN (PAY-03 item 6) */
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 bg-pastel-red text-pastel-red-ink rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-ink">Mã đơn thanh toán đã hết hạn (30 phút)</h4>
            <p className="text-xs text-subtle mt-1 max-w-sm mx-auto">
              Đơn hàng này đã quá thời gian giữ chỗ 30 phút. Vui lòng bấm nút bên dưới để khởi tạo một đơn thanh toán mới.
            </p>
          </div>
          <Button onClick={initOrder} loading={loading} className="mx-auto">
            Tạo mã thanh toán mới
          </Button>
        </div>
      ) : (
        /* TRẠNG THÁI ĐANG THANH TOÁN (VietQR) */
        <div className="space-y-5">
          {/* Preview Ngày Hết Hạn Mới (PAY-06 item 3) */}
          {order?.expectedExpiresAt && (
            <div className="p-3 rounded-lg bg-pastel-blue text-pastel-blue-ink flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} /> Ngày hết hạn gói PRO mới:
              </span>
              <span className="font-bold">{formatDate(order.expectedExpiresAt)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Khung Mã QR VietQR */}
            <div className="flex flex-col items-center justify-center p-4 bg-canvas rounded-lg border border-hairline">
              {loading || !order ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-subtle">
                  <RefreshCw size={24} className="animate-spin text-brand" />
                  <span className="text-xs">Đang khởi tạo VietQR...</span>
                </div>
              ) : (
                <>
                  <img
                    src={order.qrUrl}
                    alt="VietQR Payment Code"
                    className="w-52 h-52 object-contain rounded-lg border border-hairline bg-white p-2"
                  />

                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-subtle block">Thời gian đếm ngược (30 phút)</span>
                    <span className="text-sm font-mono font-bold text-pastel-yellow-ink">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Chi Tiết Chuyển Khoản */}
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-subtle block mb-1">Số tiền cần chuyển</span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-pastel-yellow text-pastel-yellow-ink">
                  <span className="text-lg font-bold">{order?.amount.toLocaleString('vi-VN')} đ</span>
                  <span className="text-[10px] font-semibold">Gói PRO (30 ngày)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-subtle block mb-0.5">Ngân hàng</span>
                  <span className="font-semibold text-ink text-xs">{order?.bankName || 'MBBank'}</span>
                </div>

                <div>
                  <span className="text-subtle block mb-0.5">Số tài khoản (có nút sao chép)</span>
                  <div className="flex items-center justify-between p-2 bg-canvas border border-hairline rounded-lg">
                    <span className="font-mono font-semibold text-ink text-xs">{order?.bankAccount}</span>
                    <button
                      onClick={() => copyToClipboard(order?.bankAccount || '', 'acc')}
                      className="p-1 text-subtle hover:text-brand transition-colors cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'acc' ? <Check size={14} className="text-pastel-green-ink" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-subtle block mb-0.5">
                    Nội dung chuyển khoản <strong className="text-ink">(chính xác)</strong>
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-pastel-yellow text-pastel-yellow-ink">
                    <span className="font-mono font-bold text-xs tracking-wider">{order?.paymentCode}</span>
                    <button
                      onClick={() => copyToClipboard(order?.paymentCode || '', 'code')}
                      className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'code' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cảnh báo 2 phút chuyển tiền (PAY-04 item 3) */}
              {elapsedSeconds >= 120 && (
                <div className="p-2.5 rounded-lg bg-pastel-blue text-pastel-blue-ink text-[11px] space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Info size={13} /> Lưu ý chuyển tiền:
                  </p>
                  <p>
                    Giao dịch chuyển khoản từ ngân hàng có thể mất từ 1 - 3 phút để hệ thống ghi nhận. Đừng lo lắng, tài khoản của bạn sẽ tự mở khóa ngay khi tiền về!
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="pt-2 border-t border-hairline space-y-2">
                <div className="flex items-center gap-2 text-subtle">
                  <RefreshCw size={12} className="animate-spin text-brand shrink-0" />
                  <span className="text-[11px]">Hệ thống tự động kiểm tra mỗi 3 giây...</span>
                </div>

                <Button variant="secondary" onClick={handleManualCheck} loading={loading} className="w-full">
                  <ShieldCheck size={14} />
                  Tôi đã chuyển khoản thành công
                </Button>

                {/* Phản hồi sau khi bấm kiểm tra thủ công — PENDING/PARTIAL_PAID/CANCELLED/lỗi mạng. */}
                {checkingNotice && (
                  <div className="p-2.5 rounded-lg bg-pastel-yellow text-pastel-yellow-ink text-[11px] font-medium">
                    {checkingNotice}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hướng dẫn ngắn hỗ trợ chuyển sai (PAY-03 item 7) */}
          <div className="p-3 bg-canvas border border-hairline rounded-lg text-[11px] text-subtle space-y-1">
            <p className="font-semibold text-ink flex items-center gap-1">
              <HelpCircle size={13} /> Cần trợ giúp chuyển nhầm?
            </p>
            <p>
              Nếu bạn chuyển nhầm nội dung hoặc nhầm số tiền, vui lòng giữ lại Mã đơn hàng{' '}
              <strong className="font-mono text-ink">{order?.paymentCode}</strong> và liên hệ CSKH tại{' '}
              <a href="mailto:support@taskflow.vn" className="text-brand underline">support@taskflow.vn</a> để được xử lý thủ công.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
