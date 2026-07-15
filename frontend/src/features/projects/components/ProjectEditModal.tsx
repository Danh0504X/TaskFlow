import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { toDateInputValue } from '@/lib/format'
import {
  projectFormSchema,
  type ProjectFormValues,
} from '../project.schema'
import { PROJECT_STATUS, type Project, type UpdateProjectPayload } from '../project.types'
import { useUpdateProject } from '../hooks/useProjectMutations'

interface ProjectEditModalProps {
  open: boolean
  onClose: () => void
  project: Project | null
}

const statusOptions = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Đang hoạt động' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Hoàn thành' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Đã huỷ' },
]

const fieldInputClass =
  'w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle'

/** Modal sửa thông tin project. Tạo project mới dùng trình hướng dẫn ở /projects/new. */
const ProjectEditModal = ({ open, onClose, project }: ProjectEditModalProps) => {
  const updateMutation = useUpdateProject()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
  })

  // Mỗi lần mở modal với project khác: nạp lại dữ liệu vào form.
  useEffect(() => {
    if (!open || !project) return
    reset({
      name: project.name,
      description: project.description ?? '',
      deadline: toDateInputValue(project.deadline),
      status: project.status,
    })
  }, [open, project, reset])

  const onSubmit = handleSubmit((values) => {
    if (!project) return

    const payload: UpdateProjectPayload = {
      name: values.name,
      description: values.description?.trim() ?? '',
      deadline: values.deadline ? values.deadline : null,
      status: values.status,
    }
    updateMutation.mutate(
      { id: project._id, payload },
      { onSuccess: () => onClose() },
    )
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
        <h2 className="text-xl font-extrabold text-brand tracking-tight">Sửa dự án</h2>
        <p className="text-muted mt-1.5 text-xs font-semibold">Cập nhật thông tin không gian dự án.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="project-name" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Tên dự án <span className="text-red-500">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            placeholder="VD: Website bán hàng"
            className={fieldInputClass}
            {...register('name')}
          />
          {errors.name?.message && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-description" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Mô tả
          </label>
          <textarea
            id="project-description"
            rows={4}
            placeholder="Mô tả ngắn về dự án (không bắt buộc)"
            className={`${fieldInputClass} resize-none`}
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="project-deadline" className="text-xs font-extrabold text-ink uppercase tracking-wider">
              Deadline
            </label>
            <input
              id="project-deadline"
              type="date"
              className={fieldInputClass}
              {...register('deadline')}
            />
            {errors.deadline?.message && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.deadline.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-status" className="text-xs font-extrabold text-ink uppercase tracking-wider">
              Trạng thái
            </label>
            <div className="relative">
              <select
                id="project-status"
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
            {errors.status?.message && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.status.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-line/10">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2.5 hover:bg-slate-100 border border-line/30 rounded-xl text-xs font-bold text-muted hover:text-ink transition-all disabled:opacity-45 disabled:pointer-events-none"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 bg-brand text-white hover:bg-brand-light rounded-xl text-xs font-bold shadow-lg shadow-brand/15 transition-all disabled:opacity-45 disabled:pointer-events-none"
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ProjectEditModal
