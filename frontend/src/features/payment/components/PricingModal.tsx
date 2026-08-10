import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, X, Shield, Info, HelpCircle, ArrowRight, Zap } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUpgrade: () => void
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectUpgrade,
}) => {
  const { user } = useAuthStore()

  if (!isOpen) return null

  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()
  const isExpiredPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) <= new Date()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden text-ink my-8"
        >
          {/* Header Bảng giá */}
          <div className="relative bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 p-6 border-b border-hairline text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-subtle hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-surface/50 cursor-pointer"
            >
              <X size={20} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
              <Crown size={14} /> Bảng Giá & Gói Dịch Vụ TaskFlow
            </span>
            <h2 className="text-2xl font-bold text-ink tracking-tight">
              Chọn Gói Phù Hợp Cho Nhu Cầu Của Bạn
            </h2>
            <p className="text-xs text-subtle mt-1 max-w-lg mx-auto">
              Nâng tầm năng suất làm việc với sự hỗ trợ từ AI sinh thông minh và quản lý công việc chuyên nghiệp.
            </p>
          </div>

          {/* Body content */}
          <div className="p-6 space-y-6">
            {/* Grid 2 Gói */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GÓI FREE */}
              <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${!isPro ? 'border-brand bg-brand/5 shadow-md' : 'border-hairline bg-canvas'}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-ink">Gói FREE</h3>
                    {!isPro && (
                      <span className="text-[10px] uppercase font-extrabold bg-subtle/20 text-subtle px-2 py-0.5 rounded-full">
                        Đang sử dụng
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-subtle">Dành cho người mới bắt đầu trải nghiệm TaskFlow</p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-ink">0 đ</span>
                    <span className="text-xs text-subtle">/ vĩnh viễn</span>
                  </div>

                  <hr className="border-hairline" />

                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Giới hạn <strong>5 lượt AI/ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Quản lý dự án, Sprint, Kanban Board</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Mời thành viên làm việc chung</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-hairline">
                  <button
                    disabled
                    className="w-full py-2.5 bg-canvas border border-hairline text-subtle text-xs font-semibold rounded-xl cursor-not-allowed text-center"
                  >
                    {!isPro ? 'Gói hiện tại của bạn' : 'Gói miễn phí'}
                  </button>
                </div>
              </div>

              {/* GÓI PRO */}
              <div className={`p-5 rounded-2xl border relative transition-all flex flex-col justify-between ${isPro ? 'border-amber-500 bg-amber-500/5 shadow-xl' : 'border-amber-500/40 bg-surface shadow-lg'}`}>
                {/* Badge Nổi bật */}
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                  Khuyên Dùng
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-ink flex items-center gap-1.5">
                      <Crown size={18} className="text-amber-500" /> Gói PRO (VIP)
                    </h3>
                    {isPro && (
                      <span className="text-[10px] uppercase font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Đang kích hoạt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-subtle">Mở khóa sức mạnh AI tối đa cho công việc cá nhân</p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-amber-500">99.000 đ</span>
                    <span className="text-xs text-subtle">/ 30 ngày (Thanh toán 1 lần)</span>
                  </div>

                  <hr className="border-hairline" />

                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-center gap-2">
                      <Zap size={16} className="text-amber-500 shrink-0" />
                      <span><strong>AI KHÔNG GIỚI HẠN</strong> số lượt sinh mỗi ngày</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Tự động tối ưu Prompt & phân tích Task chuyên sâu</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Ưu tiên tốc độ xử lý AI và hỗ trợ nhanh 24/7</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-hairline space-y-2">
                  <button
                    onClick={() => {
                      onClose()
                      onSelectUpgrade()
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPro ? 'Gia hạn gói PRO (+30 Ngày)' : isExpiredPro ? 'Gia hạn gói PRO ngay' : 'Nâng cấp lên gói PRO ngay'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Lưu ý Quan trọng BR-26 & Điều khoản */}
            <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-2 text-[11px] text-subtle">
              <p className="flex items-start gap-1.5 font-semibold text-ink">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                Lưu ý quan trọng về Gói Dịch Vụ:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  <strong>Quyền sử dụng cá nhân (BR-26):</strong> Gói PRO được áp dụng cho chính tài khoản cá nhân của bạn, <em>không tự động mở khóa tính năng PRO cho các thành viên khác</em> trong dự án do bạn làm chủ.
                </li>
                <li>
                  <strong>Thanh toán 1 lần cho 30 ngày:</strong> Đây là thanh toán một lần, hệ thống <strong>KHÔNG tự động gia hạn</strong> và <strong>KHÔNG tự động trừ tiền</strong> tài khoản ngân hàng của bạn.
                </li>
                <li>
                  <strong>Gia hạn cộng dồn (BR-24):</strong> Nếu bạn đang còn hạn gói PRO và thực hiện Gia hạn, thời gian 30 ngày mới sẽ được cộng dồn tiếp nối vào ngày hết hạn cũ.
                </li>
              </ul>

              <div className="pt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1">
                  <Shield size={12} className="text-emerald-500" /> Thanh toán an toàn VietQR qua ngân hàng
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      alert('Điều khoản dịch vụ TaskFlow: Thanh toán VietQR SePay minh bạch, đảm bảo quyền lợi sử dụng PRO.')
                    }}
                    className="text-brand hover:underline flex items-center gap-1"
                  >
                    Điều khoản dịch vụ
                  </a>
                  <a
                    href="mailto:support@taskflow.vn"
                    className="text-brand hover:underline flex items-center gap-1"
                  >
                    <HelpCircle size={12} /> Hỗ trợ khách hàng
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
