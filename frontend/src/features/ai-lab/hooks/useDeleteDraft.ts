import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Xoá 1 draft chưa được chấp nhận. */
export const useDeleteDraft = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draftId: string) => aiApi.deleteDraft(projectId, draftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      toast.success('Đã xoá draft')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
