import type { AiGenerationStatus } from './ai.types'

// Dùng chung cho mọi nơi hiển thị card lịch sử lượt sinh (AiLabPage.tsx, AiGenerationHistoryPanel.tsx)
// — cùng bộ pastel đang dùng cho trạng thái draft (xem DraftRow.tsx STATUS_STYLE), chỉ khác field
// nguồn (AiGenerationStatus của lượt sinh, không phải AiDraftIssue.status của từng draft).
export const GENERATION_STATUS_STYLE: Record<AiGenerationStatus, string> = {
  PENDING: 'bg-pastel-blue text-pastel-blue-ink',
  PROCESSING: 'bg-pastel-blue text-pastel-blue-ink',
  COMPLETED: 'bg-pastel-green text-pastel-green-ink',
  FAILED: 'bg-pastel-red text-pastel-red-ink',
}

export const GENERATION_STATUS_LABEL: Record<AiGenerationStatus, string> = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
}
