import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Chấp nhận 1/nhiều/toàn bộ draft (bằng tempId) -> tạo issue thật. */
export const useAcceptDrafts = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tempIds: string[]) => aiApi.acceptDrafts(projectId, generationId, tempIds),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      toast.success(`Đã tạo ${result.created.length} issue`)
      if (result.skipped.length > 0) {
        toast.error(`${result.skipped.length} draft bị bỏ qua vì epic cha chưa được chấp nhận`)
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
