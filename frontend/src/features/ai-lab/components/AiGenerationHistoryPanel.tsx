import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format'
import Spinner from '@/components/ui/Spinner'
import { useGenerations } from '../hooks/useGenerations'
import { AI_GENERATION_TYPE } from '../ai.types'
import { GENERATION_STATUS_STYLE, GENERATION_STATUS_LABEL } from '../ai.constants'

interface AiGenerationHistoryPanelProps {
  projectId: string
  activeGenerationId: string | null
  onSelect: (generationId: string) => void
}

/** Cột lịch sử bên trái modal "Sinh Epic bằng AI" — chỉ liệt kê lượt REQ_TO_EPIC (không CLARIFY,
 * không EPIC_TO_TASK vì modal này không dùng luồng đó). Luôn chiếm trọn chiều cao khung cố định
 * do component cha (AiGenerateEpicModal) cấp qua flex `h-full` — thiếu nội dung thì để trống,
 * dư thì tự cuộn riêng bên trong, không đụng tới scroll của cột bên phải. */
const AiGenerationHistoryPanel = ({ projectId, activeGenerationId, onSelect }: AiGenerationHistoryPanelProps) => {
  const { data: generations, isLoading } = useGenerations(projectId)

  const history = (generations ?? []).filter(
    (gen) => gen.generationType === AI_GENERATION_TYPE.REQ_TO_EPIC,
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center gap-2 text-xs text-subtle">
        <Spinner /> Đang tải...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <p className="text-xs text-subtle">Chưa có lượt sinh nào.</p>
      </div>
    )
  }

  return (
    <div className="h-full space-y-1.5 overflow-y-auto pr-1">
      {history.map((gen) => {
        const isActive = activeGenerationId === gen._id

        return (
          <button
            key={gen._id}
            type="button"
            onClick={() => onSelect(gen._id)}
            className={cn(
              'flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
              isActive ? 'border-ink bg-canvas' : 'border-hairline hover:bg-canvas/60',
            )}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/8 text-brand">
              <Sparkles size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-ink">
                {gen.inputPrompt || 'Yêu cầu không có tiêu đề'}
              </p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-[9px] text-subtle">{formatRelativeTime(gen.createdAt)}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    GENERATION_STATUS_STYLE[gen.status],
                  )}
                >
                  {GENERATION_STATUS_LABEL[gen.status]}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default AiGenerationHistoryPanel
