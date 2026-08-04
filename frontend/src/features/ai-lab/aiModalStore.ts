import { create } from 'zustand'

/** Ngữ cảnh mở modal — xác định luôn generationType, không cần tab/dropdown chọn lại. */
export type AiModalContext =
  | { generationType: 'REQ_TO_EPIC' }
  | { generationType: 'EPIC_TO_TASK'; sourceEntityId: string; sourceEpicTitle: string }

interface AiModalState {
  isOpen: boolean
  projectId: string | null
  context: AiModalContext | null
  /** null = đang ở màn nhập liệu (chưa chọn/tạo lượt sinh nào). */
  activeGenerationId: string | null
  openForRequirement: (projectId: string) => void
  openForEpic: (projectId: string, epicId: string, epicTitle: string) => void
  close: () => void
  setActiveGenerationId: (id: string | null) => void
}

/**
 * Store riêng cho modal "Sinh AI nhanh" ở trang chi tiết project — tách khỏi state cục bộ của
 * component để ĐÓNG MODAL KHÔNG MẤT NGỮ CẢNH: generation vẫn chạy nền ở server bất kể modal có
 * đang mở hay không (xem aiGeneration.service.js#runWorker), phần còn thiếu chỉ là FE phải nhớ
 * "đang xem lượt nào" xuyên suốt các lần đóng/mở — Zustand (module-level, không unmount theo
 * component) giải quyết đúng việc đó mà không cần persist xuống localStorage.
 */
export const useAiModalStore = create<AiModalState>((set) => ({
  isOpen: false,
  projectId: null,
  context: null,
  activeGenerationId: null,

  openForRequirement: (projectId) =>
    set({ isOpen: true, projectId, context: { generationType: 'REQ_TO_EPIC' }, activeGenerationId: null }),

  openForEpic: (projectId, epicId, epicTitle) =>
    set({
      isOpen: true,
      projectId,
      context: { generationType: 'EPIC_TO_TASK', sourceEntityId: epicId, sourceEpicTitle: epicTitle },
      activeGenerationId: null,
    }),

  // Chỉ ẩn UI — KHÔNG xoá projectId/context/activeGenerationId, để mở lại đúng đang xem gì.
  close: () => set({ isOpen: false }),

  setActiveGenerationId: (id) => set({ activeGenerationId: id }),
}))
