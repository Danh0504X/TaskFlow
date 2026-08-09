import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Layers, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import ProjectPicker from '../components/ProjectPicker'
import GenerateForm from '../components/GenerateForm'
import GenerationStatus from '../components/GenerationStatus'
import DraftTable from '../components/DraftTable'
import { useGenerations } from '../hooks/useGenerations'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
import { AI_GENERATION_TYPE } from '../ai.types'
import { GENERATION_STATUS_STYLE, GENERATION_STATUS_LABEL } from '../ai.constants'

type LabTab = 'GENERATE' | 'HISTORY'

interface AiLabNavState {
  /** Đi thẳng từ nút "Sinh Epic bằng AI" ở header trang chi tiết project (ProjectWorkspacePage)
   * -> chọn sẵn project + lượt sinh vừa tạo, khỏi phải chọn lại qua ProjectPicker. */
  initialProjectId?: string
  initialGenerationId?: string
}

/** AI Lab (Beta/Demo) — PM chọn dự án -> nhập requirement (Req->Epic) hoặc chọn 1 epic
 * (Epic->Task) -> AI đề xuất draft -> PM duyệt (sửa/thêm tay/xoá/chấp nhận/từ chối) -> chấp
 * nhận mới tạo issue thật. Không đụng luồng project/issue có sẵn — hoàn toàn cô lập ở /ai-lab.
 *
 * Bố cục: ProjectPicker cố định gọn ở đầu trang (không cuộn theo), bên dưới tách hẳn 2 tab
 * "Sinh mới" (form + kết quả draft của lượt đang xem) và "Lịch sử" (toàn bộ lượt đã sinh) — mỗi
 * khu vực có vùng nội dung riêng, tránh phải cuộn qua lại giữa form/lịch sử/kết quả như trước. */
const AiLabPage = () => {
  const location = useLocation()
  const navState = location.state as AiLabNavState | null

  const [projectId, setProjectId] = useState<string | null>(navState?.initialProjectId ?? null)
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(
    navState?.initialGenerationId ?? null,
  )
  const [activeTab, setActiveTab] = useState<LabTab>('GENERATE')
  // Route "/ai-lab" không có param -> React Router tái dùng cùng 1 instance nếu bấm nút AI ở
  // project khác trong khi trang này đã mount sẵn (cùng cách ProjectWorkspacePage xử lý
  // initialTab qua navigate state) -> cần so lệch state để áp lại initial* khi điều hướng lặp.
  const [appliedNavState, setAppliedNavState] = useState(location.state)
  if (location.state !== appliedNavState) {
    setAppliedNavState(location.state)
    if (navState?.initialProjectId) {
      setProjectId(navState.initialProjectId)
      setActiveGenerationId(navState.initialGenerationId ?? null)
      setActiveTab('GENERATE')
    }
  }

  const { data: generations } = useGenerations(projectId)
  const { data: activeGeneration } = useGenerationPolling(projectId, activeGenerationId)

  const handleProjectChange = (id: string) => {
    setProjectId(id)
    setActiveGenerationId(null)
    setActiveTab('GENERATE')
  }

  const handleSelectHistory = (generationId: string) => {
    setActiveGenerationId(generationId)
    setActiveTab('GENERATE')
  }

  const historyGenerations = (generations ?? []).filter(
    (gen) => gen.generationType !== AI_GENERATION_TYPE.CLARIFY,
  )

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
        <>
          <Tabs
            items={[
              { value: 'GENERATE', label: 'Sinh mới' },
              { value: 'HISTORY', label: 'Lịch sử' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            layoutGroupId="ai-lab-page-tabs"
          />

          {activeTab === 'GENERATE' && (
            <>
              <section className="space-y-4 rounded-xl border border-hairline bg-surface p-5">
                <GenerateForm projectId={projectId} onCreated={setActiveGenerationId} />
              </section>

              {activeGenerationId && activeGeneration && (
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
            </>
          )}

          {activeTab === 'HISTORY' && (
            <section className="space-y-2 rounded-xl border border-hairline bg-surface p-5">
              {historyGenerations.length === 0 ? (
                <p className="text-xs text-subtle">Chưa có lượt sinh nào cho dự án này.</p>
              ) : (
                <div className="space-y-1.5">
                  {historyGenerations.map((gen) => {
                    const isActive = activeGenerationId === gen._id
                    const TypeIcon = gen.generationType === 'REQ_TO_EPIC' ? Sparkles : Layers

                    return (
                      <button
                        key={gen._id}
                        type="button"
                        onClick={() => handleSelectHistory(gen._id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors',
                          isActive ? 'border-ink bg-canvas' : 'border-hairline hover:bg-canvas/60',
                        )}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/8 text-brand">
                          <TypeIcon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink">
                            {gen.generationType === 'REQ_TO_EPIC' ? 'Req → Epic' : 'Epic → Task'}
                          </p>
                          <p className="text-[10px] text-subtle">{formatRelativeTime(gen.createdAt)}</p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            GENERATION_STATUS_STYLE[gen.status],
                          )}
                        >
                          {GENERATION_STATUS_LABEL[gen.status]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default AiLabPage
