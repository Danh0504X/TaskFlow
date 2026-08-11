import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Task nháp hiện có của 1 epic thật — gọi ngay khi mở modal "Sinh Task bằng AI" để hiện thẳng
 * bố cục quản lý draft (không cần bấm "Sinh Task" trước mới thấy gì). Không tự poll định kỳ như
 * useGenerationPolling — trạng thái "đang sinh thêm" theo dõi riêng bằng GenerationTurnWatcher,
 * xong thì invalidate query này để nạp lại danh sách mới nhất. */
export const useEpicTaskDrafts = (projectId: string | null, epicId: string | undefined) => {
  return useQuery({
    queryKey: aiKeys.epicTaskDrafts(projectId ?? '', epicId ?? ''),
    queryFn: () => aiApi.getEpicTaskDrafts(projectId as string, epicId as string),
    enabled: !!projectId && !!epicId,
  })
}
