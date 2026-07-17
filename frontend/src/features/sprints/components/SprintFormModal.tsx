import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { toDateInputValue } from '@/lib/format'
import { createSprintFormSchema, editSprintFormSchema, type SprintFormValues } from '../sprint.schema'
import { useCreateSprint, useUpdateSprint } from '../hooks/useSprintMutations'
import { SPRINT_STATUS, type Sprint } from '../sprint.types'

interface SprintFormModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  /** null/undefined = tạo mới. Có giá trị = sửa sprint đã tồn tại (chỉ gọi cho PLANNED/ACTIVE — COMPLETED/CANCELLED không cho sửa). */
  sprint?: Sprint | null
}

const fieldInputClass =
  'w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle disabled:opacity-50 disabled:cursor-not-allowed'

const emptyValues: SprintFormValues = { name: '', goal: '', startDate: '', endDate: '' }

/** Modal tạo/sửa sprint. Sửa startDate bị khóa khi sprint đang ACTIVE (đã bắt đầu, giống Jira). */
const SprintFormModal = ({ open, onClose, projectId, sprint }: SprintFormModalProps) => {
  const isEdit = !!sprint
  const isActive = sprint?.status === SPRINT_STATUS.ACTIVE
  const createMutation = useCreateSprint(projectId)
  const updateMutation = useUpdateSprint(projectId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(isEdit ? editSprintFormSchema : createSprintFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    if (sprint) {
      reset({
        name: sprint.name,
        goal: sprint.goal ?? '',
        startDate: toDateInputValue(sprint.startDate),
        endDate: toDateInputValue(sprint.endDate),
      })
    } else {
      reset(emptyValues)
    }
  }, [open, sprint, reset])

  const onSubmit = handleSubmit((values) => {
    if (isEdit && sprint) {
      // Không gửi startDate khi sprint đang ACTIVE -> backend từ chối (409) nếu field này
      // có mặt trong body bất kể giá trị có đổi hay không (xem sprintService.updateSprint).
      const payload = isActive
        ? { name: values.name, goal: values.goal, endDate: values.endDate }
        : values
      updateMutation.mutate({ sprintId: sprint._id, payload }, { onSuccess: onClose })
      return
    }

    createMutation.mutate(values, { onSuccess: onClose })
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Sửa sprint' : 'Tạo sprint mới'} className="max-w-lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="sprint-name" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Tên sprint <span className="text-red-500">*</span>
          </label>
          <input id="sprint-name" type="text" placeholder="VD: Sprint 1" className={fieldInputClass} {...register('name')} />
          {errors.name?.message && <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sprint-goal" className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Mục tiêu
          </label>
          <textarea
            id="sprint-goal"
            rows={2}
            placeholder="Mục tiêu của sprint (không bắt buộc)"
            className={`${fieldInputClass} resize-none`}
            {...register('goal')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="sprint-start" className="text-xs font-extrabold text-ink uppercase tracking-wider">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              id="sprint-start"
              type="date"
              className={fieldInputClass}
              disabled={isActive}
              {...register('startDate')}
            />
            {isActive && (
              <p className="text-[10px] text-subtle font-semibold">Không thể đổi ngày bắt đầu của sprint đang chạy.</p>
            )}
            {errors.startDate?.message && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sprint-end" className="text-xs font-extrabold text-ink uppercase tracking-wider">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input id="sprint-end" type="date" className={fieldInputClass} {...register('endDate')} />
            {errors.endDate?.message && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-line/10">
          <Button variant="secondary" onClick={onClose} disabled={isPending} type="button">
            Huỷ
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo sprint'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SprintFormModal
