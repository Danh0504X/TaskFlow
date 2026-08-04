import { History } from 'lucide-react'
import { cn } from '@/lib/cn'
import Spinner from '@/components/ui/Spinner'
import { useGenerations } from '../hooks/useGenerations'
import type { AiModalContext } from '../aiModalStore'
import type { AiGenerationStatus } from '../ai.types'

interface AiGenerationHistoryPanelProps {
  projectId: string
  context: AiModalContext
  activeGenerationId: string | null
  onSelect: (id: string) => void
}

const STATUS_DOT: Record<AiGenerationStatus, string> = {
  PENDING: 'bg-subtle',
  PROCESSING: 'bg-pastel-blue-ink animate-pulse',
  COMPLETED: 'bg-pastel-green-ink',
  FAILED: 'bg-pastel-red-ink',
}

/** Cột lịch sử bên phải modal — chỉ hiện đúng lịch sử KHỚP ngữ cảnh đang mở (REQ_TO_EPIC của cả
 * project, hoặc EPIC_TO_TASK của ĐÚNG epic đang xem) để không lẫn lịch sử của epic khác vào. */
const AiGenerationHistoryPanel = ({ projectId, context, activeGenerationId, onSelect }: AiGenerationHistoryPanelProps) => {
  const { data: generations, isLoading } = useGenerations(projectId)

  const filtered = (generations ?? []).filter((gen) => {
    if (gen.generationType !== context.generationType) return false
    if (context.generationType === 'EPIC_TO_TASK') {
      return gen.sourceEntityId?._id === context.sourceEntityId
    }
    return true
  })

  return (
    <div className="flex h-full min-w-0 flex-col border-l border-hairline pl-4">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        <History size={12} /> Lịch sử
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-subtle">
          <Spinner /> Đang tải...
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[11px] text-subtle">Chưa có lượt sinh nào</p>
      ) : (
        <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
          {filtered.map((gen) => (
            <button
              key={gen._id}
              type="button"
              onClick={() => onSelect(gen._id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors',
                activeGenerationId === gen._id
                  ? 'border-brand/40 bg-canvas'
                  : 'border-hairline hover:bg-canvas',
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[gen.status])} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-ink">
                  #{gen._id.slice(-6)}
                </span>
                <span className="block text-[10px] text-subtle">
                  {new Date(gen.createdAt).toLocaleString('vi-VN')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AiGenerationHistoryPanel
