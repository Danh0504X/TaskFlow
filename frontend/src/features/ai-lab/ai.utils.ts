import type { AiGeneration, AiGenerationStatus } from './ai.types'

export const truncateText = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text

/** Nhãn trạng thái lượt sinh — dùng chung cho GenerationStatus.tsx và AiQuickGenerateModal.tsx.
 * Đặt ở đây (không phải trong file component) vì react-refresh không cho 1 file vừa export
 * component vừa export hằng số khác. */
export const GENERATION_STATUS_LABEL: Record<AiGenerationStatus, string> = {
  PENDING: 'Đang chờ xử lý...',
  PROCESSING: 'AI đang phân tích và sinh issue...',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Sinh thất bại',
}

/** Mô tả ngắn "sinh từ đâu" cho 1 lượt sinh — REQ_TO_EPIC bám vào inputPrompt, EPIC_TO_TASK bám
 * vào title epic nguồn (đã populate). Dùng chung cho danh sách lịch sử (AiLabPage) và banner
 * ngữ cảnh trong modal (AiQuickGenerateModal) — tránh viết lại logic này 2 lần. */
export const getGenerationContextLabel = (gen: Pick<AiGeneration, 'generationType' | 'inputPrompt' | 'sourceEntityId'>, max = 44) => {
  if (gen.generationType === 'REQ_TO_EPIC') {
    const prompt = gen.inputPrompt?.trim()
    return prompt ? `Từ yêu cầu: "${truncateText(prompt, max)}"` : 'Từ yêu cầu'
  }
  if (gen.sourceEntityId && typeof gen.sourceEntityId === 'object' && gen.sourceEntityId.title) {
    return `Từ epic: "${truncateText(gen.sourceEntityId.title, max)}"`
  }
  return gen.sourceEntityId ? 'Từ epic' : 'Từ epic (đã xoá)'
}
