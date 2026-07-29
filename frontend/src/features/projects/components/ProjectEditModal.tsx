import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
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

const FORM_ID = 'project-edit-form'

const statusOptions = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Đang hoạt động' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Hoàn thành' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Đã huỷ' },
]

const fieldInputClass =
  'w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle'
const fieldLabelClass = 'text-xs font-semibold text-ink uppercase tracking-wider'
const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'
const fieldErrorBorder = 'border-pastel-red-ink/50 focus:ring-pastel-red-ink/20'

/** Modal sửa thông tin project. Tạo project mới dùng trình hướng dẫn ở /projects/new. */
const ProjectEditModal = ({ open, onClose, project }: ProjectEditModalProps) => {
  const updateMutation = useUpdateProject()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
  })

  // Watch các trường để phục vụ bộ đếm ký tự và hiển thị cảnh báo
  const nameValue = watch('name') || ''
  const keyValue = watch('key') || ''
  const descriptionValue = watch('description') || ''
  const statusValue = watch('status')

  // Mỗi lần mở modal với project khác: nạp lại dữ liệu vào form.
  useEffect(() => {
    if (!open || !project) return
    reset({
      name: project.name,
      key: project.key,
      description: project.description ?? '',
      deadline: toDateInputValue(project.deadline),
      status: project.status,
    })
  }, [open, project, reset])

  const onSubmit = handleSubmit((values) => {
    if (!project) return

    const payload: UpdateProjectPayload = {
      name: values.name,
      key: values.key,
      description: values.description?.trim() ?? '',
      deadline: values.deadline ? values.deadline : null,
      status: values.status,
    }
    updateMutation.mutate(
      { id: project._id, payload },
      { onSuccess: () => onClose() },
    )
  })

  // Hỏi xác nhận trước khi đóng nếu có thay đổi chưa lưu
  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn huỷ bỏ các thay đổi này không?'
      )
      if (!confirmClose) return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Sửa dự án"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={updateMutation.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={updateMutation.isPending} disabled={!isDirty}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {/* Hàng 1: Tên dự án và Mã dự án */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="project-name" className={fieldLabelClass}>
              Tên dự án <span className="text-pastel-red-ink">*</span>
            </label>
            <div className="relative">
              <input
                id="project-name"
                type="text"
                placeholder="VD: Website bán hàng"
                className={`${fieldInputClass} pr-14 ${errors.name ? fieldErrorBorder : ''}`}
                {...register('name')}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted pointer-events-none">
                {nameValue.length}/150
              </span>
            </div>
            {errors.name?.message && <p className={fieldErrorClass}>{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-key" className={fieldLabelClass}>
              Mã dự án <span className="text-pastel-red-ink">*</span>
            </label>
            <div className="relative">
              <input
                id="project-key"
                type="text"
                placeholder="VD: WEB"
                className={`${fieldInputClass} pr-12 uppercase ${errors.key ? fieldErrorBorder : ''}`}
                {...register('key', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  }
                })}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted pointer-events-none">
                {keyValue.length}/10
              </span>
            </div>
            {errors.key?.message && <p className={fieldErrorClass}>{errors.key.message}</p>}
          </div>
        </div>

        {/* Mô tả */}
        <div className="space-y-1.5">
          <label htmlFor="project-description" className={fieldLabelClass}>
            Mô tả
          </label>
          <div className="relative">
            <textarea
              id="project-description"
              rows={4}
              placeholder="Mô tả ngắn về dự án (không bắt buộc)"
              className={`${fieldInputClass} resize-none pb-8 pr-4 ${errors.description ? fieldErrorBorder : ''}`}
              {...register('description')}
            />
            <span className="absolute right-4 bottom-3.5 text-[9px] font-semibold text-muted pointer-events-none">
              {descriptionValue.length}/2000
            </span>
          </div>
          {errors.description?.message && <p className={fieldErrorClass}>{errors.description.message}</p>}
        </div>

        {/* Deadline và Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="project-deadline" className={fieldLabelClass}>
              Deadline
            </label>
            <input
              id="project-deadline"
              type="date"
              className={`${fieldInputClass} ${errors.deadline ? fieldErrorBorder : ''}`}
              {...register('deadline')}
            />
            {errors.deadline?.message && <p className={fieldErrorClass}>{errors.deadline.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-status" className={fieldLabelClass}>
              Trạng thái
            </label>
            <div className="relative">
              <select
                id="project-status"
                className={`${fieldInputClass} appearance-none cursor-pointer pr-9 ${errors.status ? fieldErrorBorder : ''}`}
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
            {errors.status?.message && <p className={fieldErrorClass}>{errors.status.message}</p>}
          </div>
        </div>

        {/* Cảnh báo thay đổi trạng thái đặc biệt */}
        {statusValue === PROJECT_STATUS.COMPLETED && (
          <div className="p-3 bg-pastel-yellow rounded-lg text-[10px] font-medium text-pastel-yellow-ink flex items-start gap-2">
            <span className="text-xs">⚠️</span>
            <span>Lưu ý: Hoàn thành dự án sẽ đánh dấu tất cả công việc đã kết thúc. Hãy đảm bảo tất cả các task đã hoàn thành.</span>
          </div>
        )}
        {statusValue === PROJECT_STATUS.CANCELLED && (
          <div className="p-3 bg-pastel-red rounded-lg text-[10px] font-medium text-pastel-red-ink flex items-start gap-2">
            <span className="text-xs">⚠️</span>
            <span>Cảnh báo: Huỷ dự án sẽ tạm đóng băng mọi hoạt động. Bạn vẫn có thể kích hoạt lại dự án sau này nếu cần.</span>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default ProjectEditModal
