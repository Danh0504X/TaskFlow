import { AxiosError } from 'axios'
import { getApiErrorMessage } from '@/lib/http'
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

/** Câu báo lỗi CỐ ĐỊNH, thân thiện, hiện cho PM khi 1 lượt sinh AI FAILED — dùng chung cho
 * GenerationStatus.tsx (banner) và DraftTable.tsx (toast khi turn "Sinh Task" thất bại). */
export const AI_FAILURE_MESSAGE = 'Máy chủ AI đang gặp sự cố, vui lòng thử lại sau.'

/** `generation.errorMessage` từ backend thường là message kỹ thuật thô từ provider AI (Gemini/
 * OpenAI/Anthropic) hoặc lỗi mạng (vd "GoogleGenerativeAI Error: [503]...") — không phù hợp hiện
 * thẳng cho PM. Hàm này log lỗi thật ra console (F12 xem được, phục vụ debug) rồi trả về câu
 * chung chung để hiển thị lên UI — lỗi thật không mất dấu, vẫn còn trong console FE, log server,
 * và field `errorMessage` lưu ở MongoDB (AiGeneration), chỉ không phơi thẳng ra giao diện. */
export const reportAiFailure = (rawErrorMessage?: string | null): string => {
  if (rawErrorMessage) console.error('[AI Lab] Lượt sinh AI thất bại:', rawErrorMessage)
  return AI_FAILURE_MESSAGE
}

/** true nếu là lỗi máy chủ 5xx không lường trước (thường do provider AI/mạng bên dưới ném ra,
 * xem clarifyRequirement ở backend) — false nếu là lỗi validate 4xx có chủ đích (message do
 * chính app tự viết trong ApiError, an toàn và hữu ích khi hiện thẳng cho PM). */
const isUnexpectedServerError = (error: unknown): boolean =>
  error instanceof AxiosError && (error.response?.status ?? 0) >= 500

/** Dùng cho mutation gọi AI ĐỒNG BỘ (vd useClarifyRequirement — khác useCreateGeneration/
 * runWorker chạy nền, lỗi AI thật không lọt qua response ban đầu) — 5xx thì ẩn message kỹ thuật
 * thô sau reportAiFailure, 4xx (vd "inputPrompt tối đa 5000 ký tự") giữ nguyên. */
export const getAiErrorMessage = (error: unknown): string => {
  const message = getApiErrorMessage(error)
  return isUnexpectedServerError(error) ? reportAiFailure(message) : message
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
