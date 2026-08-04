import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import type { AddDraftPayload } from '../ai.types'

/** PM tự thêm 1 epic/task vào mẻ đang duyệt (origin=MANUAL). */
export const useAddDraft = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddDraftPayload) => aiApi.addDraft(projectId, generationId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      toast.success('Đã thêm draft')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
