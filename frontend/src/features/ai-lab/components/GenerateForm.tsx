import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Sparkles } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { ISSUE_TYPE } from '@/features/issues/issue.types'
import {
  generateFromEpicSchema,
  generateFromRequirementSchema,
  type GenerateFromEpicValues,
  type GenerateFromRequirementValues,
} from '../ai.schema'
import { AI_GENERATION_TYPE, type AiGenerationType } from '../ai.types'
import { useCreateGeneration } from '../hooks/useCreateGeneration'

interface GenerateFormProps {
  projectId: string
  onCreated: (generationId: string) => void
}

const fieldInputClass =
  'w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle'
const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'

/** Form 2 chế độ: "Từ yêu cầu (Epic)" (REQ_TO_EPIC) và "Từ Epic (Task)" (EPIC_TO_TASK).
 * Submit thành công -> chỉ nhận generationId (202, worker chạy nền) -> báo lên AiLabPage để
 * bắt đầu poll (GenerationStatus/DraftTable). */
const GenerateForm = ({ projectId, onCreated }: GenerateFormProps) => {
  const [mode, setMode] = useState<AiGenerationType>(AI_GENERATION_TYPE.REQ_TO_EPIC)
  const createMutation = useCreateGeneration(projectId)
  const { data: issues = [] } = useProjectIssues(projectId)
  const epics = issues.filter((issue) => issue.type === ISSUE_TYPE.EPIC)

  const reqForm = useForm<GenerateFromRequirementValues>({
    resolver: zodResolver(generateFromRequirementSchema),
    defaultValues: { inputPrompt: '' },
  })

  const epicForm = useForm<GenerateFromEpicValues>({
    resolver: zodResolver(generateFromEpicSchema),
    defaultValues: { sourceEntityId: '' },
  })

  const promptValue = reqForm.watch('inputPrompt') || ''

  const submitReqToEpic = reqForm.handleSubmit((values) => {
    createMutation.mutate(
      { generationType: AI_GENERATION_TYPE.REQ_TO_EPIC, inputPrompt: values.inputPrompt },
      {
        onSuccess: (res) => {
          onCreated(res.generationId)
          reqForm.reset({ inputPrompt: '' })
        },
      },
    )
  })

  const submitEpicToTask = epicForm.handleSubmit((values) => {
    createMutation.mutate(
      { generationType: AI_GENERATION_TYPE.EPIC_TO_TASK, sourceEntityId: values.sourceEntityId },
      { onSuccess: (res) => onCreated(res.generationId) },
    )
  })

  return (
    <div className="space-y-4">
      <Tabs
        items={[
          { value: AI_GENERATION_TYPE.REQ_TO_EPIC, label: 'Từ yêu cầu (Epic)' },
          { value: AI_GENERATION_TYPE.EPIC_TO_TASK, label: 'Từ Epic (Task)' },
        ]}
        value={mode}
        onChange={setMode}
        layoutGroupId="ai-lab-mode-tabs"
      />

      {mode === AI_GENERATION_TYPE.REQ_TO_EPIC ? (
        <form onSubmit={submitReqToEpic} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                rows={6}
                placeholder={
                  'Mô tả yêu cầu nghiệp vụ (càng chi tiết, AI càng đề xuất sát)...\n' +
                  'VD: Xây dựng hệ thống đặt lịch khám bệnh trực tuyến — người dùng đăng ký/đăng nhập, ' +
                  'đặt lịch khám, bác sĩ xác nhận, có thông báo nhắc lịch qua email.'
                }
                className={`${fieldInputClass} resize-none pb-6`}
                {...reqForm.register('inputPrompt')}
              />
              <span className="absolute bottom-3 right-3.5 text-[9px] font-semibold text-muted">
                {promptValue.length}/5000
              </span>
            </div>
            {reqForm.formState.errors.inputPrompt?.message && (
              <p className={fieldErrorClass}>{reqForm.formState.errors.inputPrompt.message}</p>
            )}
          </div>
          <Button type="submit" variant="primary" loading={createMutation.isPending}>
            <Sparkles size={15} /> Sinh Epic
          </Button>
        </form>
      ) : (
        <form onSubmit={submitEpicToTask} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <div className="relative">
              <select
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                {...epicForm.register('sourceEntityId')}
              >
                <option value="">-- Chọn 1 epic --</option>
                {epics.map((epic) => (
                  <option key={epic._id} value={epic._id}>
                    {epic.key} · {epic.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
            </div>
            {epics.length === 0 && <p className="text-[10px] font-medium text-subtle">Dự án chưa có Epic nào.</p>}
            {epicForm.formState.errors.sourceEntityId?.message && (
              <p className={fieldErrorClass}>{epicForm.formState.errors.sourceEntityId.message}</p>
            )}
          </div>
          <Button type="submit" variant="primary" loading={createMutation.isPending} disabled={epics.length === 0}>
            <Sparkles size={15} /> Sinh Task
          </Button>
        </form>
      )}
    </div>
  )
}

export default GenerateForm
