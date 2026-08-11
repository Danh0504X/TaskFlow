import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layers, Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useAiModalStore } from '../aiModalStore'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
import { useCreateGeneration } from '../hooks/useCreateGeneration'
import { generateFromRequirementSchema, type GenerateFromRequirementValues } from '../ai.schema'
import { AI_GENERATION_TYPE, type AiGenerationDetail } from '../ai.types'
import { getGenerationContextLabel, GENERATION_STATUS_LABEL } from '../ai.utils'
import GenerationStatus from './GenerationStatus'
import DraftTable from './DraftTable'
import AiGenerationHistoryPanel from './AiGenerationHistoryPanel'

const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'

interface RequirementFormProps {
  projectId: string
  onCreated: (id: string) => void
}

/** Form REQ_TO_EPIC rút gọn — không cần tab chọn chế độ như GenerateForm ở /ai-lab vì ngữ cảnh
 * (mở từ nút "Sinh Epic bằng AI") đã xác định sẵn generationType. Bố cục dạng "composer" (textarea
 * + thanh hành động liền dưới trong cùng 1 khối viền) thay vì textarea rộng hết cỡ + nút rời rạc
 * — thu hẹp về 1 cột đọc thoải mái và canh giữa trong không gian modal cố định chiều cao. */
const RequirementForm = ({ projectId, onCreated }: RequirementFormProps) => {
  const createMutation = useCreateGeneration(projectId)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GenerateFromRequirementValues>({
    resolver: zodResolver(generateFromRequirementSchema),
    defaultValues: { inputPrompt: '' },
  })
  const promptValue = watch('inputPrompt') || ''

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(
      { generationType: AI_GENERATION_TYPE.REQ_TO_EPIC, inputPrompt: values.inputPrompt },
      { onSuccess: (res) => onCreated(res.generationId) },
    )
  })

  return (
    <div className="flex h-full flex-col items-center justify-center px-2">
      <div className="w-full max-w-xl space-y-4">
        <div className="space-y-1 text-center">
          <h3 className="font-editorial text-lg font-medium text-ink">Mô tả yêu cầu nghiệp vụ</h3>
          <p className="text-xs text-subtle">Càng chi tiết, AI càng đề xuất sát với dự án của bạn.</p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="rounded-xl border border-hairline bg-surface transition-colors focus-within:border-ink/25">
            <textarea
              rows={6}
              placeholder="Ví dụ: học viên đăng ký khóa học, thanh toán, làm quiz, nhận chứng chỉ..."
              className="w-full resize-none rounded-t-xl bg-transparent px-4 pt-4 pb-2 text-sm text-ink outline-none placeholder:text-subtle"
              autoFocus
              {...register('inputPrompt')}
            />
            <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-2.5">
              <span className="text-[10px] font-medium text-subtle">{promptValue.length}/5000</span>
              <Button type="submit" variant="primary" size="sm" loading={createMutation.isPending}>
                <Sparkles size={13} /> Sinh Epic
              </Button>
            </div>
          </div>
          {errors.inputPrompt?.message && <p className={`${fieldErrorClass} mt-1.5`}>{errors.inputPrompt.message}</p>}
        </form>
      </div>
    </div>
  )
}

interface EpicTaskFormProps {
  projectId: string
  sourceEntityId: string
  sourceEpicTitle: string
  onCreated: (id: string) => void
}

/** EPIC_TO_TASK không cần nhập gì — epic nguồn đã biết sẵn (mở từ nút trên chính epic đó). */
const EpicTaskForm = ({ projectId, sourceEntityId, sourceEpicTitle, onCreated }: EpicTaskFormProps) => {
  const createMutation = useCreateGeneration(projectId)

  const handleGenerate = () => {
    createMutation.mutate(
      { generationType: AI_GENERATION_TYPE.EPIC_TO_TASK, sourceEntityId },
      { onSuccess: (res) => onCreated(res.generationId) },
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-2">
      <div className="w-full max-w-xl space-y-4 rounded-xl border border-hairline bg-surface p-6 text-center">
        <div className="space-y-1">
          <h3 className="font-editorial text-lg font-medium text-ink">Sinh task cho epic này</h3>
          <p className="text-sm text-ink">"{sourceEpicTitle}"</p>
        </div>
        <Button variant="primary" className="w-full" loading={createMutation.isPending} onClick={handleGenerate}>
          <Sparkles size={15} /> Sinh Task
        </Button>
      </div>
    </div>
  )
}

/** Banner ngữ cảnh — "được sinh từ yêu cầu/epic nào", đặt ngay trên trạng thái/bảng draft vì
 * modal không tự nói rõ điều này (khác /ai-lab, ở đây không có cột lịch sử làm rõ sẵn). */
const GenerationContextBanner = ({ generation }: { generation: AiGenerationDetail }) => (
  <div className="flex items-start gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2">
    <Layers size={14} className="mt-0.5 shrink-0 text-brand" />
    <p className="text-xs text-ink">{getGenerationContextLabel(generation, 160)}</p>
  </div>
)

/**
 * Modal "Sinh AI nhanh" gắn trong trang chi tiết project — đọc toàn bộ state từ aiModalStore
 * (không cần props), nên mount 1 lần ở ProjectWorkspacePage là đủ. 2 cột: trái là khu làm việc
 * chính (nhập liệu / đang xử lý / bảng draft), phải là lịch sử các lượt sinh cùng ngữ cảnh —
 * đóng modal không huỷ gì (xem aiModalStore.ts), mở lại vẫn đúng lượt đang xem.
 */
const AiQuickGenerateModal = () => {
  const { isOpen, projectId, context, activeGenerationId, close, setActiveGenerationId } = useAiModalStore()
  const { data: activeGeneration } = useGenerationPolling(projectId, activeGenerationId)

  if (!projectId || !context) return null

  return (
    <Modal open={isOpen} onClose={close} layout="xl" title="Sinh bằng AI" icon={<Sparkles size={18} />}>
      {/* min-w-0 trên cột trái là bắt buộc: mặc định track "1fr" của CSS Grid không tự co
          nhỏ hơn kích thước nội dung bên trong (vd bảng draft nhiều cột) — thiếu dòng này,
          DraftTable ép cả lưới rộng ra, đẩy cột lịch sử tràn ra ngoài rìa modal.
          h-[640px] cố định chiều cao modal: ít draft -> để trống phần dưới, nhiều draft -> tự
          cuộn dọc bên trong bảng (xem max-h + overflow-y-auto ở DraftTable), không kéo dài modal.
          Modal 'xl' (rộng hơn 'wide' trước đây) + DraftRow rút gọn còn 1 dòng -> nhiều draft hiện
          cùng lúc hơn hẳn mà không phải cuộn. */}
      <div className="grid h-[640px] grid-cols-1 gap-5 overflow-x-hidden sm:grid-cols-[1fr_240px]">
        {/* scrollbar-gutter:stable — luôn chừa sẵn chỗ cho thanh cuộn dọc, kể cả khi chưa cần
            cuộn. Thiếu dòng này: thu gọn/mở epic (ẩn-hiện task con) đổi chiều cao nội dung, thanh
            cuộn xuất-hiện/biến-mất đột ngột kéo cả cột co giãn theo -> cảm giác "vỡ" layout. */}
        <div className="h-full min-w-0 overflow-y-auto [scrollbar-gutter:stable]">
          {!activeGenerationId ? (
            context.generationType === 'REQ_TO_EPIC' ? (
              <RequirementForm projectId={projectId} onCreated={setActiveGenerationId} />
            ) : (
              <EpicTaskForm
                projectId={projectId}
                sourceEntityId={context.sourceEntityId}
                sourceEpicTitle={context.sourceEpicTitle}
                onCreated={setActiveGenerationId}
              />
            )
          ) : (
            activeGeneration && (
              <div className="flex h-full flex-col gap-4">
                <GenerationContextBanner generation={activeGeneration} />

                {/* PENDING/PROCESSING: spinner canh giữa phần không gian còn lại (flex-1), thay
                    vì nằm lửng lơ ngay dưới banner để trống cả mảng lớn phía dưới. */}
                {(activeGeneration.status === 'PENDING' || activeGeneration.status === 'PROCESSING') && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    <Spinner className="h-8 w-8 text-brand" />
                    <p className="text-sm font-medium text-ink">{GENERATION_STATUS_LABEL[activeGeneration.status]}</p>
                  </div>
                )}

                {activeGeneration.status === 'FAILED' && (
                  <GenerationStatus
                    status={activeGeneration.status}
                    errorMessage={activeGeneration.errorMessage}
                    onRetry={() => setActiveGenerationId(null)}
                  />
                )}

                {activeGeneration.status === 'COMPLETED' && (
                  <DraftTable
                    projectId={projectId}
                    generationId={activeGenerationId}
                    drafts={activeGeneration.drafts}
                  />
                )}
              </div>
            )
          )}
        </div>

        <AiGenerationHistoryPanel
          projectId={projectId}
          activeGenerationId={activeGenerationId}
          onSelect={setActiveGenerationId}
        />
      </div>
    </Modal>
  )
}

export default AiQuickGenerateModal
