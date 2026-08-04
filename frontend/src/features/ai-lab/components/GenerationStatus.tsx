import { AlertTriangle } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import type { AiGenerationStatus } from '../ai.types'
import { GENERATION_STATUS_LABEL } from '../ai.utils'

interface GenerationStatusProps {
  status: AiGenerationStatus
  errorMessage?: string | null
  onRetry?: () => void
  retrying?: boolean
}

/** Banner trạng thái lượt sinh — component cha (AiLabPage) chỉ render DraftTable khi COMPLETED,
 * nên ở đây không cần xử lý case đó (trả về null). */
const GenerationStatus = ({ status, errorMessage, onRetry, retrying }: GenerationStatusProps) => {
  if (status === 'COMPLETED') return null

  if (status === 'FAILED') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-pastel-red-ink/25 bg-pastel-red p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-pastel-red-ink" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-pastel-red-ink">{GENERATION_STATUS_LABEL.FAILED}</p>
          <p className="mt-1 text-xs text-pastel-red-ink/80">
            {errorMessage || 'Đã có lỗi xảy ra khi gọi AI. Vui lòng thử lại.'}
          </p>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry}>
            Sinh lại
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
      <Spinner className="h-5 w-5 text-brand" />
      <p className="text-sm font-medium text-ink">{GENERATION_STATUS_LABEL[status]}</p>
    </div>
  )
}

export default GenerationStatus
