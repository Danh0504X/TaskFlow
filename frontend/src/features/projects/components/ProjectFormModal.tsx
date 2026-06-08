import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { toDateInputValue } from '@/lib/format'
import {
  projectFormSchema,
  type ProjectFormValues,
} from '../project.schema'
import {
  PROJECT_STATUS,
  type Project,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '../project.types'
import { useCreateProject, useUpdateProject } from '../hooks/useProjectMutations'

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  /** Có project -> chế độ Sửa; không có -> chế độ Thêm mới. */
  project?: Project | null
}

const statusOptions = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Đang hoạt động' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Hoàn thành' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Đã huỷ' },
]

const emptyForm: ProjectFormValues = {
  name: '',
  description: '',
  deadline: '',
  status: PROJECT_STATUS.ACTIVE,
}

const ProjectFormModal = ({ open, onClose, project }: ProjectFormModalProps) => {
  const isEdit = !!project
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyForm,
  })

  // Mỗi lần mở modal: nạp dữ liệu project (sửa) hoặc reset rỗng (thêm).
  useEffect(() => {
    if (!open) return
    reset(
      project
        ? {
            name: project.name,
            description: project.description ?? '',
            deadline: toDateInputValue(project.deadline),
            status: project.status,
          }
        : emptyForm,
    )
  }, [open, project, reset])

  const onSubmit = handleSubmit((values) => {
    // Chuẩn hoá: deadline rỗng -> null; description rỗng -> ''.
    const deadline = values.deadline ? values.deadline : null
    const description = values.description?.trim() ?? ''

    if (isEdit && project) {
      const payload: UpdateProjectPayload = {
        name: values.name,
        description,
        deadline,
        status: values.status,
      }
      updateMutation.mutate(
        { id: project._id, payload },
        { onSuccess: () => onClose() },
      )
    } else {
      // Tạo mới: backend tự đặt status = ACTIVE, không gửi status lên.
      const payload: CreateProjectPayload = { name: values.name, description, deadline }
      createMutation.mutate(payload, { onSuccess: () => onClose() })
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa project' : 'Tạo project mới'}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          id="project-name"
          label="Tên project *"
          placeholder="VD: Website bán hàng"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          id="project-description"
          label="Mô tả"
          placeholder="Mô tả ngắn về project (không bắt buộc)"
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          id="project-deadline"
          type="date"
          label="Deadline"
          error={errors.deadline?.message}
          {...register('deadline')}
        />

        {/* Status chỉ chỉnh khi sửa — tạo mới luôn mặc định ACTIVE. */}
        {isEdit && (
          <Select
            id="project-status"
            label="Trạng thái"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ProjectFormModal
