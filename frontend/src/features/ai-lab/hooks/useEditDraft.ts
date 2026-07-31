import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import type { EditDraftPayload } from '../ai.types'

/** Sửa title/description/priority của 1 draft ngay tại màn duyệt (chỉ khi còn SUGGESTED). */
export const useEditDraft = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ draftId, payload }: { draftId: string; payload: EditDraftPayload }) =>
      aiApi.editDraft(projectId, draftId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      toast.success('Đã cập nhật draft')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
