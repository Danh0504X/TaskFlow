import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import PageHeader from '@/components/layout/PageHeader'
import PageHeaderButton from '@/components/layout/PageHeaderButton'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import { staggerContainer } from '@/lib/motion'
import { AvatarCard } from '../components/AvatarCard'
import { AiQuotaCard } from '../components/AiQuotaCard'
import { PersonalInfoForm } from '../components/PersonalInfoForm'
import { SecuritySettings } from '../components/SecuritySettings'
import { PaymentHistoryTab } from '@/features/payment/components/PaymentHistoryTab'
import { PricingModal } from '@/features/payment/components/PricingModal'
import { UpgradeModal } from '@/features/payment/components/UpgradeModal'
import { Eye, Crown } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { authApi } from '@/features/auth/auth.api'

type ProfileTab = 'profile' | 'payments'

const TAB_ITEMS: TabItem<ProfileTab>[] = [
  { value: 'profile', label: 'Thông tin cá nhân & Bảo mật' },
  { value: 'payments', label: 'Lịch sử thanh toán & Gói PRO' },
]

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
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
      <PageHeader
        title="Hồ sơ của tôi"
        subtitle="Quản lý thông tin cá nhân, hạn mức AI và lịch sử thanh toán."
        actions={
          <>
            <PageHeaderButton icon={Eye} onClick={() => setIsPricingOpen(true)}>
              Xem bảng giá
            </PageHeaderButton>
            <PageHeaderButton icon={Crown} variant="primary" onClick={() => setIsUpgradeOpen(true)}>
              {isPro ? 'Gia hạn PRO' : 'Nâng cấp PRO'}
            </PageHeaderButton>
          </>
        }
      />

      {/* Nav Tabs — dùng component Tabs dùng chung (pill trượt), giống mọi bộ tab khác trong app. */}
      <div className="px-8 md:px-12 pt-4">
        <Tabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} layoutGroupId="profile-tabs-pill" className="inline-flex" />
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
