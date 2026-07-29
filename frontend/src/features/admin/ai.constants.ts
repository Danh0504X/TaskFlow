import type { AiGenerationStatus, AiGenerationType } from './admin.types'
import type { BadgeColor } from '@/components/ui/Badge'

export const AI_TYPE_LABEL: Record<AiGenerationType, string> = {
  REQ_TO_EPIC: 'Yêu cầu → Epic',
  EPIC_TO_TASK: 'Epic → Task',
  TASK_TO_SUBTASK: 'Task → Subtask',
}

export const AI_STATUS_LABEL: Record<AiGenerationStatus, string> = {
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
}

export const AI_STATUS_COLOR: Record<AiGenerationStatus, BadgeColor> = {
  PROCESSING: 'amber',
  COMPLETED: 'green',
  FAILED: 'red',
}
