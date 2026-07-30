import { useState } from 'react'
import { cn } from '@/lib/cn'
import Badge from '@/components/ui/Badge'
import ProjectPicker from '../components/ProjectPicker'
import GenerateForm from '../components/GenerateForm'
import GenerationStatus from '../components/GenerationStatus'
import DraftTable from '../components/DraftTable'
import { useGenerations } from '../hooks/useGenerations'
import { useGenerationPolling } from '../hooks/useGenerationPolling'

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
            <div className="border-t border-hairline pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                Lượt sinh gần đây
              </p>
              <div className="flex flex-wrap gap-2">
                {generations.slice(0, 8).map((gen) => (
                  <button
                    key={gen._id}
                    type="button"
                    onClick={() => setActiveGenerationId(gen._id)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                      activeGenerationId === gen._id
                        ? 'border-brand/40 bg-canvas text-ink'
                        : 'border-hairline text-muted hover:bg-canvas hover:text-ink',
                    )}
                  >
                    {gen.generationType === 'REQ_TO_EPIC' ? 'Req → Epic' : 'Epic → Task'} ·{' '}
                    {new Date(gen.createdAt).toLocaleString('vi-VN')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {projectId && activeGenerationId && activeGeneration && (
        <section className="space-y-4">
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
