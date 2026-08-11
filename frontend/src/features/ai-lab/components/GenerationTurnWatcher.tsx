import { useEffect } from 'react'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
import type { AiGenerationStatus } from '../ai.types'

interface GenerationTurnWatcherProps {
  projectId: string
  turnId: string
  onSettled: (status: AiGenerationStatus, errorMessage: string | null) => void
}

/** Poll ngầm 1 turn AiGeneration tới khi xong (COMPLETED/FAILED) rồi báo qua onSettled — không
 * render gì, thuần logic. Tách riêng thành file dùng chung (DraftTable — "Sinh Task từ epic
 * nháp", AiQuickGenerateModal — "Sinh Task từ epic thật") vì có thể cần NHIỀU instance chạy song
 * song cùng lúc (mỗi turn đang chạy 1 vòng poll độc lập) — không gọi hook trong loop được nên
 * phải mount mỗi turn thành 1 component riêng như thế này. */
const GenerationTurnWatcher = ({ projectId, turnId, onSettled }: GenerationTurnWatcherProps) => {
  const { data } = useGenerationPolling(projectId, turnId)

  useEffect(() => {
    if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
      onSettled(data.status, data.errorMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status])

  return null
}

export default GenerationTurnWatcher
