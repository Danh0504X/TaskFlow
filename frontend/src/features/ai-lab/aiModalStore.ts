import { create } from 'zustand'

/** Ngữ cảnh mở modal — xác định luôn generationType, không cần tab/dropdown chọn lại. */
export type AiModalContext =
  | { generationType: 'REQ_TO_EPIC' }
  | { generationType: 'EPIC_TO_TASK'; sourceEntityId: string; sourceEpicTitle: string }

interface AiModalState {
  isOpen: boolean
  projectId: string | null
  context: AiModalContext | null
  openForRequirement: (projectId: string) => void
  openForEpic: (projectId: string, epicId: string, epicTitle: string) => void
  close: () => void
}

/**
 * Store riêng cho modal "Sinh AI nhanh" ở trang chi tiết project — tách khỏi state cục bộ của
 * component để ĐÓNG MODAL KHÔNG MẤT NGỮ CẢNH: mở lại đúng epic đang xem, dù đóng/mở nhiều lần.
 * Zustand (module-level, không unmount theo component) giải quyết đúng việc đó mà không cần
 * persist xuống localStorage.
 *
 * KHÔNG còn `activeGenerationId` — trước đây dùng để nhớ "đang xem lượt sinh nào" (điều hướng
 * qua lại giữa nhiều lượt như duyệt lịch sử). Từ khi AiQuickGenerateModal đổi sang luôn mở thẳng
 * vào bố cục quản lý draft của epic (useEpicTaskDrafts tự nạp đúng draft hiện có, không cần chọn
 * lượt), field này không còn ai đọc/ghi nữa.
 */
export const useAiModalStore = create<AiModalState>((set) => ({
  isOpen: false,
  projectId: null,
  context: null,

  openForRequirement: (projectId) =>
    set({ isOpen: true, projectId, context: { generationType: 'REQ_TO_EPIC' } }),

  openForEpic: (projectId, epicId, epicTitle) =>
    set({
      isOpen: true,
      projectId,
      context: { generationType: 'EPIC_TO_TASK', sourceEntityId: epicId, sourceEpicTitle: epicTitle },
    }),

  // Chỉ ẩn UI — KHÔNG xoá projectId/context, để mở lại đúng đang xem gì.
  close: () => set({ isOpen: false }),
}))
