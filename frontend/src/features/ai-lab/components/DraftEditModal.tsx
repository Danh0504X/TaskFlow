import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Quote } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { ISSUE_PRIORITY } from '@/features/issues/issue.types'
import { draftEditSchema, type DraftEditValues } from '../ai.schema'
import type { AiDraftIssue } from '../ai.types'
import { useEditDraft } from '../hooks/useEditDraft'

interface DraftEditModalProps {
  open: boolean
  onClose: () => void
  draft: AiDraftIssue | null
  projectId: string
  /** Title epic cha — chỉ có khi draft này là Task có parentTempId (REQ_TO_EPIC). */
  parentTitle?: string | null
  /** Title các Task con — chỉ có khi draft này là Epic đang có con trong cùng mẻ. */
  childTitles?: string[]
}

const FORM_ID = 'ai-draft-edit-form'

const priorityOptions = [
  { value: ISSUE_PRIORITY.LOW, label: 'Thấp' },
  { value: ISSUE_PRIORITY.MEDIUM, label: 'Trung bình' },
  { value: ISSUE_PRIORITY.HIGH, label: 'Cao' },
  { value: ISSUE_PRIORITY.URGENT, label: 'Khẩn cấp' },
]

const fieldInputClass =
  'w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle'
const fieldLabelClass = 'text-xs font-semibold text-ink uppercase tracking-wider'
const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'

/** Sửa title/description/priority của 1 draft ngay tại màn duyệt (chỉ khi còn SUGGESTED) — kèm
 * đầy đủ thông tin chi tiết chỉ để xem (phạm vi AI đề xuất, trích dẫn nguồn, quan hệ epic-task)
 * mà bảng chính không đủ chỗ hiển thị hết. */
const DraftEditModal = ({
  open,
  onClose,
  draft,
  projectId,
  parentTitle,
  childTitles = [],
}: DraftEditModalProps) => {
  const editMutation = useEditDraft(projectId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DraftEditValues>({
    resolver: zodResolver(draftEditSchema),
  })

  useEffect(() => {
    if (!open || !draft) return
    reset({
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
    })
  }, [open, draft, reset])

  const onSubmit = handleSubmit((values) => {
    if (!draft) return
    editMutation.mutate(
      { draftId: draft._id, payload: values },
      { onSuccess: () => onClose() },
    )
  })

  const hasContext =
    !!draft && (!!parentTitle || childTitles.length > 0 || draft.scopePreview.length > 0 || !!draft.sourceQuote?.trim())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${draft?.type === 'EPIC' ? 'Epic' : 'Task'} đề xuất`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={editMutation.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={editMutation.isPending}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {draft && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge color={draft.origin === 'AI' ? 'blue' : 'slate'}>{draft.origin === 'AI' ? 'Do AI đề xuất' : 'Thêm thủ công'}</Badge>
            {parentTitle && <Badge color="slate">Thuộc epic: {parentTitle}</Badge>}
          </div>
        )}

        {hasContext && (
          <div className="space-y-3 rounded-lg border border-hairline bg-canvas p-3">
            {draft && draft.scopePreview.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Phạm vi AI đề xuất</p>
                <ul className="space-y-0.5 pl-0.5">
                  {draft.scopePreview.map((line, idx) => (
                    <li key={idx} className="text-xs text-ink">
                      • {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {draft?.sourceQuote?.trim() && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Trích dẫn từ yêu cầu</p>
                <p className="flex items-start gap-1.5 text-xs italic text-ink">
                  <Quote size={12} className="mt-0.5 shrink-0 text-subtle" />
                  "{draft.sourceQuote}"
                </p>
              </div>
            )}

            {childTitles.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Sẽ kèm {childTitles.length} task con
                </p>
                <ul className="space-y-0.5 pl-0.5">
                  {childTitles.map((t, idx) => (
                    <li key={idx} className="truncate text-xs text-ink">
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="draft-title" className={fieldLabelClass}>
              Tiêu đề <span className="text-pastel-red-ink">*</span>
            </label>
            <input id="draft-title" type="text" className={fieldInputClass} autoFocus {...register('title')} />
            {errors.title?.message && <p className={fieldErrorClass}>{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="draft-description" className={fieldLabelClass}>
              Mô tả
            </label>
            <textarea
              id="draft-description"
              rows={3}
              className={`${fieldInputClass} resize-none`}
              {...register('description')}
            />
            {errors.description?.message && <p className={fieldErrorClass}>{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="draft-priority" className={fieldLabelClass}>
              Độ ưu tiên
            </label>
            <div className="relative">
              <select
                id="draft-priority"
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
        </form>
      </div>
    </Modal>
  )
}

export default DraftEditModal
