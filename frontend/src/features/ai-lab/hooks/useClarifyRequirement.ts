import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import { getAiErrorMessage } from '../ai.utils'
import type { ClarifyRequirementPayload } from '../ai.types'

/** AI hỏi làm rõ TRƯỚC khi tạo lượt REQ_TO_EPIC thật — đồng bộ, trả câu hỏi ngay (không cần poll).
 * Gọi AI trực tiếp trong request (không nền như createGeneration) nên lỗi provider AI thật (vd
 * Gemini 503) có thể lọt thẳng vào response — getAiErrorMessage lọc lại, chỉ hiện message validate
 * (4xx) do app tự viết, còn lỗi 5xx không lường trước thì ẩn sau câu chung chung (xem ai.utils.ts). */
export const useClarifyRequirement = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClarifyRequirementPayload) => aiApi.clarify(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generations(projectId) })
    },
    onError: (error) => toast.error(getAiErrorMessage(error)),
  })
}
