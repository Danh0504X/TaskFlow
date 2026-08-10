import type { AiGenerationType } from './admin.types'

export const AI_TYPE_LABEL: Record<AiGenerationType, string> = {
  REQ_TO_EPIC: 'Yêu cầu → Epic',
  EPIC_TO_TASK: 'Epic → Task',
}
