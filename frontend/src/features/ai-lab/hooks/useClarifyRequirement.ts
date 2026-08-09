import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import type { ClarifyRequirementPayload } from '../ai.types'

/** AI hỏi làm rõ TRƯỚC khi tạo lượt REQ_TO_EPIC thật — đồng bộ, trả câu hỏi ngay (không cần poll). */
export const useClarifyRequirement = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClarifyRequirementPayload) => aiApi.clarify(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generations(projectId) })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
