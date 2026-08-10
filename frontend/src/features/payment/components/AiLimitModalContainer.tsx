import React, { useState } from 'react'
import { AiLimitModal } from './AiLimitModal'
import { useAiLimitStore } from '../aiLimitStore'
import { PricingModal } from './PricingModal'
import { UpgradeModal } from './UpgradeModal'

export const AiLimitModalContainer: React.FC = () => {
  const { isOpen, closeModal, dailyUsedCount, dailyLimit } = useAiLimitStore()
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  return (
    <>
      <AiLimitModal
        isOpen={isOpen}
        onClose={closeModal}
        onOpenPricing={() => setIsPricingOpen(true)}
        dailyUsedCount={dailyUsedCount}
        dailyLimit={dailyLimit}
      />
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
    </>
  )
}
