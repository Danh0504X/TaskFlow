import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { ISSUE_PRIORITY } from '@/features/issues/issue.types'
import { addDraftSchema, type AddDraftValues } from '../ai.schema'
import { AI_DRAFT_TYPE, type AiDraftIssue } from '../ai.types'
import { useAddDraft } from '../hooks/useAddDraft'

interface AddDraftModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  generationId: string
  /** Danh sách epic hiện có trong mẻ — cho phép gắn task tay vào 1 epic (AI hoặc tay) đã có. */
  epicOptions: AiDraftIssue[]
}

const FORM_ID = 'ai-draft-add-form'

const typeOptions = [
  { value: AI_DRAFT_TYPE.TASK, label: 'Task' },
  { value: AI_DRAFT_TYPE.EPIC, label: 'Epic' },
]

const priorityOptions = [
  { value: ISSUE_PRIORITY.LOW, label: 'Thấp' },
  { value: ISSUE_PRIORITY.MEDIUM, label: 'Trung bình' },
  { value: ISSUE_PRIORITY.HIGH, label: 'Cao' },
  { value: ISSUE_PRIORITY.URGENT, label: 'Khẩn cấp' },
]

const defaultValues: AddDraftValues = {
  title: '',
  description: '',
  type: AI_DRAFT_TYPE.TASK,
  priority: ISSUE_PRIORITY.MEDIUM,
}

const fieldInputClass =
  'w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle'
const fieldLabelClass = 'text-xs font-semibold text-ink uppercase tracking-wider'
const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'

/** PM tự thêm 1 epic/task vào mẻ đang duyệt, không cần chờ AI (origin=MANUAL). */
const AddDraftModal = ({ open, onClose, projectId, generationId, epicOptions }: AddDraftModalProps) => {
  const addMutation = useAddDraft(projectId, generationId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddDraftValues>({
    resolver: zodResolver(addDraftSchema),
    defaultValues,
  })

  const type = watch('type')

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  useEffect(() => {
    setValue('parentTempId', undefined)
  }, [type, setValue])

  const showParentField = type === AI_DRAFT_TYPE.TASK && epicOptions.length > 0

  const onSubmit = handleSubmit((values) => {
    addMutation.mutate(values, { onSuccess: () => onClose() })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm draft thủ công"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={addMutation.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={addMutation.isPending}>
            Thêm draft
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="add-draft-title" className={fieldLabelClass}>
            Tiêu đề <span className="text-pastel-red-ink">*</span>
          </label>
          <input
            id="add-draft-title"
            type="text"
            placeholder="VD: Thêm bộ lọc issue theo người được giao"
            className={fieldInputClass}
            autoFocus
            {...register('title')}
          />
          {errors.title?.message && <p className={fieldErrorClass}>{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="add-draft-description" className={fieldLabelClass}>
            Mô tả
          </label>
          <textarea
            id="add-draft-description"
            rows={3}
            className={`${fieldInputClass} resize-none`}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="add-draft-type" className={fieldLabelClass}>
              Loại
            </label>
            <div className="relative">
              <select
                id="add-draft-type"
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                {...register('type')}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="add-draft-priority" className={fieldLabelClass}>
              Độ ưu tiên
            </label>
            <div className="relative">
              <select
                id="add-draft-priority"
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                {...register('priority')}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
            </div>
          </div>
        </div>

        {showParentField && (
          <div className="space-y-1.5">
            <label htmlFor="add-draft-parent" className={fieldLabelClass}>
              Epic cha (trong mẻ này)
            </label>
            <div className="relative">
              <select
                id="add-draft-parent"
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                {...register('parentTempId')}
              >
                <option value="">-- Không thuộc epic nào --</option>
                {epicOptions.map((epic) => (
                  <option key={epic.tempId} value={epic.tempId}>
                    {epic.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default AddDraftModal
