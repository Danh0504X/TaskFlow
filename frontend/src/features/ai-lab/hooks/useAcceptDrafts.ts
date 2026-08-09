import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { issueKeys } from '@/features/issues/issue.keys'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Chấp nhận 1/nhiều/toàn bộ draft (bằng tempId) -> tạo issue thật. */
export const useAcceptDrafts = (projectId: string, generationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tempIds: string[]) => aiApi.acceptDrafts(projectId, generationId, tempIds),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
      // Issue thật vừa tạo cần hiện ngay trong Danh sách/Board/Backlog của project (nhất là khi
      // accept diễn ra ngay trong modal ở trang project, không có điều hướng nào để tự remount
      // component và fetch lại) — invalidate theo tiền tố để khớp cả issueKeys.list (mọi filter)
      // lẫn issueKeys.bySprint.
      qc.invalidateQueries({ queryKey: [...issueKeys.lists(), projectId] })
      toast.success(`Đã tạo ${result.created.length} issue`)
      if (result.skipped.length > 0) {
        toast.error(`${result.skipped.length} draft bị bỏ qua vì epic cha chưa được chấp nhận`)
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
