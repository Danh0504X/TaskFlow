import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Layers, Sparkles, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast/toastStore'
import { useAiModalStore } from '../aiModalStore'
import { useEpicTaskDrafts } from '../hooks/useEpicTaskDrafts'
import { useCreateGeneration } from '../hooks/useCreateGeneration'
import { useClearEpicTaskDrafts } from '../hooks/useClearEpicTaskDrafts'
import { AI_GENERATION_TYPE, type AiGenerationStatus } from '../ai.types'
import { reportAiFailure } from '../ai.utils'
import { aiKeys } from '../ai.keys'
import DraftTable from './DraftTable'
import GenerationTurnWatcher from './GenerationTurnWatcher'

/**
 * Modal "Sinh Task bằng AI" cho 1 epic THẬT — gắn trong trang chi tiết project, đọc toàn bộ state
 * từ aiModalStore (không cần props), mount 1 lần ở ProjectWorkspacePage là đủ.
 *
 * Luôn mở THẲNG vào bố cục quản lý task nháp (xem/thêm/sửa/xoá/duyệt qua DraftTable) — KHÔNG còn
 * màn hình form-ở-giữa riêng biệt như trước (EpicTaskForm cũ). Nút sinh task đổi vị trí/nhãn tuỳ
 * đã có draft hay chưa: CHƯA có gì -> nút to "Tạo Task Bằng AI" nằm giữa nội dung (CTA rõ ràng
 * cho trạng thái trống); ĐÃ có draft -> chuyển vào thanh công cụ, đổi nhãn "Tạo thêm task" (không
 * còn là lần đầu). Cả 2 đều dùng chung `handleGenerate` — vì 1 epic thật giờ chỉ có đúng 1
 * "phiên" duy nhất (mọi lượt gộp theo sourceEntityId ở backend, xem resolveSessionGenerationIds),
 * không cần màn hình riêng để "bắt đầu 1 lượt mới".
 */
const AiQuickGenerateModal = () => {
  const { isOpen, projectId, context, close } = useAiModalStore()
  const queryClient = useQueryClient()
  const [creatingTurnId, setCreatingTurnId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const epicId = context?.generationType === 'EPIC_TO_TASK' ? context.sourceEntityId : undefined
  const { data: session } = useEpicTaskDrafts(projectId, epicId)
  const createMutation = useCreateGeneration(projectId ?? '')
  const clearMutation = useClearEpicTaskDrafts(projectId ?? '')

  // Modal này chỉ phục vụ EPIC_TO_TASK (từ epic thật) — REQ_TO_EPIC đã có hẳn AiGenerateEpicModal
  // riêng, aiModalStore.openForRequirement() hiện không có nơi nào gọi tới.
  if (!projectId || !context || context.generationType !== 'EPIC_TO_TASK') return null

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: aiKeys.epicTaskDrafts(projectId, context.sourceEntityId) })
  }

  const handleGenerate = () => {
    if (creatingTurnId) return
    createMutation.mutate(
      { generationType: AI_GENERATION_TYPE.EPIC_TO_TASK, sourceEntityId: context.sourceEntityId },
      { onSuccess: (res) => setCreatingTurnId(res.generationId) },
    )
  }

  const handleTurnSettled = (status: AiGenerationStatus, errorMessage: string | null) => {
    setCreatingTurnId(null)
    if (status === 'FAILED') {
      toast.error(reportAiFailure(errorMessage))
    } else {
      toast.success('Đã sinh task cho epic')
    }
    invalidateSession()
  }

  const drafts = session?.drafts ?? []
  const isGenerating = !!creatingTurnId

  return (
    <Modal open={isOpen} onClose={close} layout="wide" title="Sinh Task bằng AI" icon={<Sparkles size={18} />}>
      <div className="flex h-[520px] flex-col gap-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-canvas px-3 py-2">
          <div className="flex min-w-0 items-start gap-2">
            <Layers size={14} className="mt-0.5 shrink-0 text-brand" />
            <p className="min-w-0 truncate text-xs text-ink">
              Epic: <span className="font-semibold">"{context.sourceEpicTitle}"</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Còn trống thì nút chính đặt ở giữa nội dung (to, dễ thấy) — toolbar chỉ còn nút
                này khi ĐÃ có task, đổi nhãn "Tạo thêm task" cho đúng ý (không phải lần đầu nữa). */}
            {drafts.length > 0 && (
              <Button variant="secondary" size="sm" loading={isGenerating} onClick={handleGenerate}>
                <Sparkles size={13} /> Tạo thêm task
              </Button>
            )}
            <button
              type="button"
              disabled={drafts.length === 0}
              onClick={() => setConfirmClear(true)}
              className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-pastel-red-ink disabled:cursor-not-allowed disabled:opacity-30"
              title="Xoá tất cả & sinh lại"
              aria-label="Xoá tất cả & sinh lại"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* scrollbar-gutter:stable — luôn chừa sẵn chỗ cho thanh cuộn dọc, kể cả khi chưa cần
            cuộn. Thiếu dòng này: thu gọn/mở task đổi chiều cao nội dung, thanh cuộn xuất-hiện/
            biến-mất đột ngột kéo cả khối co giãn theo -> cảm giác "vỡ" layout. */}
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          {isGenerating && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-dashed border-hairline bg-canvas/40 px-3 py-2 text-xs font-medium text-subtle">
              <Spinner className="h-3.5 w-3.5" />
              AI đang sinh task cho epic này...
              {creatingTurnId && (
                <GenerationTurnWatcher projectId={projectId} turnId={creatingTurnId} onSettled={handleTurnSettled} />
              )}
            </div>
          )}

          {drafts.length === 0 && !isGenerating ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-semibold text-ink">Epic này chưa có task nào do AI tạo</p>
              <Button variant="primary" onClick={handleGenerate}>
                <Sparkles size={15} /> Tạo Task Bằng AI
              </Button>
            </div>
          ) : (
            session?.generationId && (
              <DraftTable
                projectId={projectId}
                generationId={session.generationId}
                drafts={drafts}
                manualAdd={{ type: 'TASK', parentIssueId: context.sourceEntityId }}
              />
            )
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Xoá tất cả & sinh lại"
        message={`Toàn bộ task nháp CHƯA duyệt của epic "${context.sourceEpicTitle}" sẽ bị xoá vĩnh viễn. Task đã duyệt (đã thành issue thật) không bị ảnh hưởng. Hành động không thể hoàn tác.`}
        danger
        loading={clearMutation.isPending}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearMutation.mutate(context.sourceEntityId, {
            onSuccess: () => {
              setConfirmClear(false)
              invalidateSession()
            },
          })
        }}
      />
    </Modal>
  )
}

export default AiQuickGenerateModal
