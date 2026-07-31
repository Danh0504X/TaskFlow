import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import type { CreateGenerationPayload } from '../ai.types'

/** Tạo lượt sinh mới (Req->Epic hoặc Epic->Task). Thành công -> chỉ trả generationId, chưa có draft
 * (worker chạy nền) -> component gọi tiếp useGenerationPolling để theo dõi tới khi xong. */
export const useCreateGeneration = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGenerationPayload) => aiApi.createGeneration(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generations(projectId) })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
