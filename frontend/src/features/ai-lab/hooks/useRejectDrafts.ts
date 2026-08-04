import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Từ chối 1/nhiều draft (bằng _id của AiDraftIssue) -> set REJECTED. */
export const useRejectDrafts = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => aiApi.rejectDrafts(projectId, generationId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      toast.success('Đã từ chối draft đã chọn')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
