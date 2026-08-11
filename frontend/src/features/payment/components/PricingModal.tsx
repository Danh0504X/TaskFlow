import React from 'react'
import { Check, Zap, Shield, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

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

  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()
  const isExpiredPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) <= new Date()

  return (
    <Modal open={isOpen} onClose={onClose} title="Bảng giá & gói dịch vụ TaskFlow" tone="premium" layout="wide">
      <p className="text-xs text-subtle -mt-1 mb-5">
        Nâng tầm năng suất làm việc với sự hỗ trợ từ AI sinh thông minh và quản lý công việc chuyên nghiệp.
      </p>

      {/* Grid 2 Gói */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* GÓI FREE */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between ${!isPro ? 'border-ink/20 bg-canvas' : 'border-hairline bg-canvas'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-ink">Gói FREE</h3>
              {!isPro && <Badge color="slate">Đang sử dụng</Badge>}
            </div>
            <p className="text-xs text-subtle">Dành cho người mới bắt đầu trải nghiệm TaskFlow</p>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">0 đ</span>
              <span className="text-xs text-subtle">/ vĩnh viễn</span>
            </div>

            <hr className="border-hairline" />

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-pastel-green-ink shrink-0" />
                <span>Giới hạn <strong>5 lượt AI/ngày</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-pastel-green-ink shrink-0" />
                <span>Quản lý dự án, Sprint, Kanban Board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-pastel-green-ink shrink-0" />
                <span>Mời thành viên làm việc chung</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-hairline">
            <Button variant="secondary" disabled className="w-full">
              {!isPro ? 'Gói hiện tại của bạn' : 'Gói miễn phí'}
            </Button>
          </div>
        </div>

        {/* GÓI PRO */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between ${isPro ? 'border-pastel-yellow-ink/60 bg-pastel-yellow/20' : 'border-hairline bg-surface'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-ink flex items-center gap-1.5">
                Gói PRO
              </h3>
              <Badge color="amber">{isPro ? 'Đang kích hoạt' : 'Khuyên dùng'}</Badge>
            </div>
            <p className="text-xs text-subtle">Mở khóa sức mạnh AI tối đa cho công việc cá nhân</p>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-pastel-yellow-ink">2.000 đ</span>
              <span className="text-xs text-subtle">/ 30 ngày (thanh toán 1 lần)</span>
            </div>

            <hr className="border-hairline" />

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Zap size={16} className="text-pastel-yellow-ink shrink-0" />
                <span><strong>AI không giới hạn</strong> số lượt sinh mỗi ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-pastel-green-ink shrink-0" />
                <span>Tự động tối ưu Prompt & phân tích Task chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-pastel-green-ink shrink-0" />
                <span>Ưu tiên tốc độ xử lý AI và hỗ trợ nhanh 24/7</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-hairline">
            <Button
              className="w-full"
              onClick={() => {
                onClose()
                onSelectUpgrade()
              }}
            >
              {isPro ? 'Gia hạn gói PRO (+30 ngày)' : isExpiredPro ? 'Gia hạn gói PRO ngay' : 'Nâng cấp lên gói PRO ngay'}
            </Button>
          </div>
        </div>
      </div>

      {/* Lưu ý Quan trọng BR-26 & Điều khoản */}
      <div className="mt-5 p-4 bg-canvas border border-hairline rounded-lg space-y-2 text-[11px] text-subtle">
        <p className="font-semibold text-ink">Lưu ý quan trọng về gói dịch vụ:</p>
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

        <div className="pt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-pastel-green-ink" /> Thanh toán an toàn VietQR qua ngân hàng
          </span>
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                alert('Điều khoản dịch vụ TaskFlow: Thanh toán VietQR SePay minh bạch, đảm bảo quyền lợi sử dụng PRO.')
              }}
              className="text-brand hover:underline"
            >
              Điều khoản dịch vụ
            </a>
            <a href="mailto:support@taskflow.vn" className="text-brand hover:underline flex items-center gap-1">
              <HelpCircle size={12} /> Hỗ trợ khách hàng
            </a>
          </div>
        </div>
      </div>
    </Modal>
  )
}
