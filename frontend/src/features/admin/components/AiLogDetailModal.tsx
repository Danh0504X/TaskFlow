import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import { useAppendAuditEntry } from '../hooks/useAuditLog'
import { useAuth } from '@/features/auth/hooks/useAuth'
import MaskedField from './MaskedField'
import { AI_STATUS_COLOR, AI_STATUS_LABEL, AI_TYPE_LABEL } from '../ai.constants'
import type { AiGenerationLog } from '../admin.types'

interface AiLogDetailModalProps {
  log: AiGenerationLog | null
  onClose: () => void
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">{label}</span>
    <p className="text-[13px] font-semibold text-ink mt-0.5">{value}</p>
  </div>
)

const AiLogDetailModal = ({ log, onClose }: AiLogDetailModalProps) => {
  const { user } = useAuth()
  const appendAudit = useAppendAuditEntry()

  if (!log) return null

  const logAudit = (field: 'inputPrompt' | 'rawOutput') => {
    appendAudit.mutate({
      adminName: user?.fullName ?? 'Admin',
      adminEmail: user?.email ?? '',
      action: 'AI_PROMPT_VIEW',
      targetLabel: `log #${log._id}`,
      detail: `Xem trường "${field === 'inputPrompt' ? 'inputPrompt' : 'rawOutput'}" của generation do ${log.userName} tạo.`,
    })
  }

  return (
    <Modal open={!!log} onClose={onClose} title={`Chi tiết generation #${log._id}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Thời gian" value={formatDate(log.createdAt)} />
          <Field label="Người dùng" value={log.userName} />
          <Field label="Loại" value={AI_TYPE_LABEL[log.type]} />
          <div>
            <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Trạng thái</span>
            <div className="mt-1">
              <Badge color={AI_STATUS_COLOR[log.status]}>{AI_STATUS_LABEL[log.status]}</Badge>
            </div>
          </div>
          <Field label="Draft / Chấp nhận" value={`${log.draftCount} / ${log.acceptedCount}`} />
          <Field label="Token" value={log.tokenCount.toLocaleString('vi-VN')} />
          <Field label="Thời gian xử lý" value={log.processingTimeMs > 0 ? `${(log.processingTimeMs / 1000).toFixed(1)}s` : '—'} />
          <Field label="Model" value={log.model} />
        </div>

        {log.errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-500">
            {log.errorMessage}
          </div>
        )}

        <div className="pt-3 border-t border-hairline space-y-3">
          <MaskedField label="inputPrompt" value={log.inputPrompt} onReveal={() => logAudit('inputPrompt')} />
          <MaskedField label="rawOutput" value={log.rawOutput} onReveal={() => logAudit('rawOutput')} />
        </div>
      </div>
    </Modal>
  )
}

export default AiLogDetailModal
