import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '@/components/layout/PageHeader'
import { staggerContainer } from '@/lib/motion'
import { AvatarCard } from '../components/AvatarCard'
import { AiQuotaCard } from '../components/AiQuotaCard'
import { PersonalInfoForm } from '../components/PersonalInfoForm'
import { SecuritySettings } from '../components/SecuritySettings'
import { PaymentHistoryTab } from '@/features/payment/components/PaymentHistoryTab'
import { PricingModal } from '@/features/payment/components/PricingModal'
import { UpgradeModal } from '@/features/payment/components/UpgradeModal'
import { User, CreditCard, Eye, Crown } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { authApi } from '@/features/auth/auth.api'

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'payments'>('profile')
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false)

  useEffect(() => {
    // Tự động đồng bộ thông tin user mới nhất từ Server khi vào trang Profile
    authApi
      .me()
      .then((latestUser) => {
        if (latestUser) setUser(latestUser)
      })
      .catch(() => {})
  }, [setUser])

  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()

  return (
    <div className="max-w-6xl mx-auto flex flex-col">
      {/* Header với các Nút Action nổi bật */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 md:px-12 pt-6">
        <div>
          <PageHeader title="Hồ sơ của tôi" subtitle="Quản lý thông tin cá nhân, hạn mức AI và lịch sử thanh toán." />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Xem Bảng Giá nổi bật ở Header */}
          <button
            onClick={() => setIsPricingOpen(true)}
            className="py-2 px-3.5 bg-canvas border border-hairline hover:bg-surface text-ink text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Eye size={14} className="text-amber-500" /> Xem Bảng Giá Dịch Vụ
          </button>

          {/* Nút Nâng cấp/Gia hạn PRO */}
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className="py-2 px-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Crown size={14} /> {isPro ? 'Gia hạn PRO' : 'Nâng cấp PRO'}
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="px-8 md:px-12 pt-4">
        <div className="flex border-b border-hairline gap-6 text-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-brand text-brand'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            <User size={16} /> Thông tin cá nhân & Bảo mật
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'border-brand text-brand'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            <CreditCard size={16} /> Lịch sử thanh toán & Gói PRO
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-8 md:px-12 pt-6 pb-12"
        >
          <div className="lg:col-span-4 flex flex-col gap-5">
            <AvatarCard />
            <AiQuotaCard
              onOpenPricing={() => setIsPricingOpen(true)}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
            />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-5">
            <PersonalInfoForm />
            <SecuritySettings />
          </div>
        </motion.div>
      ) : (
        <div className="px-8 md:px-12 pt-6 pb-12">
          <PaymentHistoryTab onOpenPricing={() => setIsPricingOpen(true)} />
        </div>
      )}

      {/* Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSelectUpgrade={() => {
          setIsPricingOpen(false)
          setIsUpgradeOpen(true)
        }}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  )
}
