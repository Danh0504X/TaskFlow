import { useState } from 'react'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import Badge from '@/components/ui/Badge'
import ProjectPicker from '../components/ProjectPicker'
import GenerateForm from '../components/GenerateForm'
import GenerationStatus from '../components/GenerationStatus'
import DraftTable from '../components/DraftTable'
import { useGenerations } from '../hooks/useGenerations'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
import { getGenerationContextLabel } from '../ai.utils'
import type { AiGeneration } from '../ai.types'

interface RecentGenerationListProps {
  title: string
  generations: AiGeneration[]
  activeGenerationId: string | null
  onSelect: (id: string) => void
}

/** 1 cột lịch sử của ĐÚNG 1 generationType — tách riêng Req→Epic và Epic→Task thành 2 cột song
 * song (thay vì trộn chung 1 hàng như trước) để không lẫn 2 loại lượt sinh vào nhau. */
const RecentGenerationList = ({ title, generations, activeGenerationId, onSelect }: RecentGenerationListProps) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{title}</p>
    {generations.length === 0 ? (
      <p className="text-[11px] text-subtle">Chưa có lượt sinh nào</p>
    ) : (
      <div className="flex flex-col gap-1.5">
        {generations.slice(0, 5).map((gen) => (
          <button
            key={gen._id}
            type="button"
            onClick={() => onSelect(gen._id)}
            className={cn(
              'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-1.5 text-left transition-colors',
              activeGenerationId === gen._id ? 'border-brand/40 bg-canvas' : 'border-hairline hover:bg-canvas',
            )}
          >
            <span className="w-full truncate text-xs font-semibold text-ink">{getGenerationContextLabel(gen)}</span>
            <span className="text-[10px] text-subtle">{new Date(gen.createdAt).toLocaleString('vi-VN')}</span>
          </button>
        ))}
      </div>
    )}
  </div>
)

/** AI Lab (Beta/Demo) — PM chọn dự án -> nhập requirement (Req->Epic) hoặc chọn 1 epic
 * (Epic->Task) -> AI đề xuất draft -> PM duyệt (sửa/thêm tay/xoá/chấp nhận/từ chối) -> chấp
 * nhận mới tạo issue thật. Không đụng luồng project/issue có sẵn — hoàn toàn cô lập ở /ai-lab. */
const AiLabPage = () => {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null)

  const { data: generations } = useGenerations(projectId)
  const { data: activeGeneration } = useGenerationPolling(projectId, activeGenerationId)

  const handleProjectChange = (id: string) => {
    setProjectId(id)
    setActiveGenerationId(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-editorial text-2xl font-medium text-ink">AI Lab</h1>
          <Badge color="blue">Beta</Badge>
        </div>
        <p className="text-sm text-subtle">AI đề xuất, bạn duyệt trước khi tạo thật.</p>
      </header>

      <section className="space-y-3 rounded-xl border border-hairline bg-surface p-5">
        <ProjectPicker value={projectId} onChange={handleProjectChange} />
        {!projectId && (
          <p className="text-xs text-subtle">Chọn một dự án phía trên để bắt đầu sinh Epic/Task bằng AI.</p>
        )}
      </section>

      {projectId && (
        <section className="space-y-4 rounded-xl border border-hairline bg-surface p-5">
          <GenerateForm projectId={projectId} onCreated={setActiveGenerationId} />

          {generations && generations.length > 0 && (
            <div className="space-y-3 border-t border-hairline pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                Lượt sinh gần đây
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RecentGenerationList
                  title="Từ yêu cầu (Epic)"
                  generations={generations.filter((g) => g.generationType === 'REQ_TO_EPIC')}
                  activeGenerationId={activeGenerationId}
                  onSelect={setActiveGenerationId}
                />
                <RecentGenerationList
                  title="Từ Epic (Task)"
                  generations={generations.filter((g) => g.generationType === 'EPIC_TO_TASK')}
                  activeGenerationId={activeGenerationId}
                  onSelect={setActiveGenerationId}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {projectId && activeGenerationId && activeGeneration && (
        <section className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-hairline bg-surface px-3 py-2">
            <Layers size={14} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-xs text-ink">{getGenerationContextLabel(activeGeneration, 160)}</p>
          </div>

          <GenerationStatus
            status={activeGeneration.status}
            errorMessage={activeGeneration.errorMessage}
            onRetry={() => setActiveGenerationId(null)}
          />

          {activeGeneration.status === 'COMPLETED' && (
            <DraftTable
              projectId={projectId}
              generationId={activeGenerationId}
              drafts={activeGeneration.drafts}
            />
          )}
        </section>
      )}
    </div>
  )
}

export default AiLabPage
