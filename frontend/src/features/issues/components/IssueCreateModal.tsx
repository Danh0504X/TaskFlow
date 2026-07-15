import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
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
  'w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle'

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
    <Modal open={open} onClose={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-xl text-muted hover:text-ink transition-all"
        aria-label="Đóng"
      >
        <X size={18} />
      </button>

      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-brand tracking-tight">Thêm issue</h2>
        <p className="text-muted mt-1.5 text-xs font-semibold">Tạo mới một công việc trong dự án.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="issue-title" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            id="issue-title"
            type="text"
            placeholder="VD: Thiết kế màn hình đăng nhập"
            className={fieldInputClass}
            autoFocus
            {...register('title')}
          />
          {errors.title?.message && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-description" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Mô tả
          </label>
          <textarea
            id="issue-description"
            rows={3}
            placeholder="Mô tả chi tiết công việc (không bắt buộc)"
            className={`${fieldInputClass} resize-none`}
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="issue-type" className="text-xs font-extrabold text-ink uppercase tracking-wider">
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
            <label htmlFor="issue-priority" className="text-xs font-extrabold text-ink uppercase tracking-wider">
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
            <label htmlFor="issue-status" className="text-xs font-extrabold text-ink uppercase tracking-wider">
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
              <label htmlFor="issue-parent" className="text-xs font-extrabold text-ink uppercase tracking-wider">
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
              {errors.parentIssueId?.message && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.parentIssueId.message}</p>
              )}
              {parentOptions.length === 0 && (
                <p className="text-[10px] text-subtle font-semibold">Chưa có Epic nào trong dự án.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-line/10">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="px-4 py-2.5 hover:bg-slate-100 border border-line/30 rounded-xl text-xs font-bold text-muted hover:text-ink transition-all disabled:opacity-45 disabled:pointer-events-none"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-brand text-white hover:bg-brand-light rounded-xl text-xs font-bold shadow-lg shadow-brand/15 transition-all disabled:opacity-45 disabled:pointer-events-none"
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo issue'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default IssueCreateModal
