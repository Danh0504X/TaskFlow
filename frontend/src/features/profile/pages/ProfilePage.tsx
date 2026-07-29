import { motion } from 'motion/react'
import PageHeader from '@/components/layout/PageHeader'
import { staggerContainer } from '@/lib/motion'
import { AvatarCard } from '../components/AvatarCard'
import { AiQuotaCard } from '../components/AiQuotaCard'
import { PersonalInfoForm } from '../components/PersonalInfoForm'
import { SecuritySettings } from '../components/SecuritySettings'

export function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col">
      <PageHeader title="Hồ sơ của tôi" subtitle="Quản lý thông tin cá nhân và bảo mật tài khoản." />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-8 md:px-12 pt-6 pb-12"
      >
        <div className="lg:col-span-4 flex flex-col gap-5">
          <AvatarCard />
          <AiQuotaCard />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-5">
          <PersonalInfoForm />
          <SecuritySettings />
        </div>
      </motion.div>
    </div>
  )
}
