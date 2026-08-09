import { create } from 'zustand'

interface AiLimitStoreState {
  isOpen: boolean
  dailyUsedCount: number
  dailyLimit: number
  openModal: (dailyUsedCount?: number, dailyLimit?: number) => void
  closeModal: () => void
}

export const useAiLimitStore = create<AiLimitStoreState>((set) => ({
  isOpen: false,
  dailyUsedCount: 5,
  dailyLimit: 5,
  openModal: (dailyUsedCount = 5, dailyLimit = 5) =>
    set({ isOpen: true, dailyUsedCount, dailyLimit }),
  closeModal: () => set({ isOpen: false }),
}))
