import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** "Xoá tất cả & sinh lại từ đầu" cho 1 epic thật — xoá HẲN mọi task nháp chưa duyệt của epic đó
 * (xem clearEpicTaskDrafts ở backend). Invalidate theo TIỀN TỐ (không kèm generationId cụ thể) vì
 * hành động này xoá draft xuyên suốt MỌI turn "Sinh Task" đã từng tạo cho epic — có thể đang cache
 * dưới nhiều generationId khác nhau nếu PM từng xem qua lịch sử. */
export const useClearEpicTaskDrafts = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (epicId: string) => aiApi.clearEpicTaskDrafts(projectId, epicId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [...aiKeys.all, 'generation', projectId] })
      toast.success(`Đã xoá ${result.deletedCount} task nháp — sẵn sàng sinh lại.`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
