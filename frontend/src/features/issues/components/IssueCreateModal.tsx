import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { issueFormSchema, type IssueFormValues } from '../issue.schema'
import {
  ISSUE_PRIORITY,
  ISSUE_STATUS,
  ISSUE_TYPE,
  type CreateIssuePayload,
  type Issue,
} from '../issue.types'
import { useCreateIssue } from '../hooks/useIssueMutations'

interface IssueCreateModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  /** Issue hiện có của project — dùng để gợi ý Epic/Task cha phù hợp với type đang chọn. */
  issues: Issue[]
}

const FORM_ID = 'issue-create-form'

// Chỉ cho tạo Task/Epic từ modal này — Bug và Subtask chưa được hỗ trợ ở Board/Backlog.
const typeOptions = [
  { value: ISSUE_TYPE.TASK, label: 'Task' },
  { value: ISSUE_TYPE.EPIC, label: 'Epic' },
]

const statusOptions = [
  { value: ISSUE_STATUS.TODO, label: 'Cần làm' },
  { value: ISSUE_STATUS.IN_PROGRESS, label: 'Đang làm' },
  { value: ISSUE_STATUS.IN_REVIEW, label: 'Đang đánh giá' },
  { value: ISSUE_STATUS.DONE, label: 'Hoàn thành' },
]

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

const defaultValues: IssueFormValues = {
  title: '',
  description: '',
  type: ISSUE_TYPE.TASK,
  status: ISSUE_STATUS.TODO,
  priority: ISSUE_PRIORITY.MEDIUM,
  parentIssueId: '',
}

/** Modal tạo issue mới trong project. Mặc định type = Task, status = Cần làm, priority = Trung bình. */
const IssueCreateModal = ({ open, onClose, projectId, issues }: IssueCreateModalProps) => {
  const createMutation = useCreateIssue(projectId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues,
  })

  const type = watch('type')

  // Mỗi lần mở modal: nạp lại form về mặc định (Task/Cần làm/Trung bình, chưa chọn issue cha).
  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  // Chuyển sang Epic -> field Epic cha bị ẩn -> xoá lựa chọn cũ cho sạch state.
  useEffect(() => {
    setValue('parentIssueId', '')
  }, [type, setValue])

  // Epic không có cha -> chỉ Task mới cần chọn Epic cha (không bắt buộc).
  const showParentField = type === ISSUE_TYPE.TASK
  const parentOptions = issues.filter((i) => i.type === ISSUE_TYPE.EPIC)

  const onSubmit = handleSubmit((values) => {
    const payload: CreateIssuePayload = {
      title: values.title,
      description: values.description?.trim() || undefined,
      type: values.type,
      status: values.status,
      priority: values.priority,
      parentIssueId: values.parentIssueId || null,
    }
    createMutation.mutate(payload, { onSuccess: () => onClose() })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm issue"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={createMutation.isPending}>
            Tạo issue
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="issue-title" className={fieldLabelClass}>
            Tiêu đề <span className="text-pastel-red-ink">*</span>
          </label>
          <input
            id="issue-title"
            type="text"
            placeholder="VD: Thiết kế màn hình đăng nhập"
            className={fieldInputClass}
            autoFocus
            {...register('title')}
          />
          {errors.title?.message && <p className={fieldErrorClass}>{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-description" className={fieldLabelClass}>
            Mô tả
          </label>
          <textarea
            id="issue-description"
            rows={3}
            placeholder="Mô tả chi tiết công việc (không bắt buộc)"
            className={`${fieldInputClass} resize-none`}
            {...register('description')}
          />
          {errors.description?.message && <p className={fieldErrorClass}>{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="issue-type" className={fieldLabelClass}>
              Loại
            </label>
            <div className="relative">
              <select
                id="issue-type"
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
            <label htmlFor="issue-priority" className={fieldLabelClass}>
              Độ ưu tiên
            </label>
            <div className="relative">
              <select
                id="issue-priority"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="issue-status" className={fieldLabelClass}>
              Trạng thái
            </label>
            <div className="relative">
              <select
                id="issue-status"
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                {...register('status')}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
            </div>
          </div>

          {showParentField && (
            <div className="space-y-1.5">
              <label htmlFor="issue-parent" className={fieldLabelClass}>
                Epic cha
              </label>
              <div className="relative">
                <select
                  id="issue-parent"
                  className={`${fieldInputClass} appearance-none cursor-pointer pr-9`}
                  {...register('parentIssueId')}
                >
                  <option value="">-- Không thuộc epic nào --</option>
                  {parentOptions.map((issue) => (
                    <option key={issue._id} value={issue._id}>
                      {issue.key} · {issue.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
              </div>
              {errors.parentIssueId?.message && <p className={fieldErrorClass}>{errors.parentIssueId.message}</p>}
              {parentOptions.length === 0 && (
                <p className="text-[10px] text-subtle font-medium">Chưa có Epic nào trong dự án.</p>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default IssueCreateModal
