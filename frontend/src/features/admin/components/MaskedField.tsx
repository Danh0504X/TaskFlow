import { useState } from 'react'
import { Eye } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface MaskedFieldProps {
  label: string
  value: string
  /** Gọi khi admin xác nhận xem nội dung — dùng để ghi nhật ký hệ thống. */
  onReveal: () => void
}

/** Trường nội dung nhạy cảm (inputPrompt/rawOutput của AI) — mặc định che, chỉ hiện sau khi
 * admin xác nhận qua ConfirmDialog (hành động này được ghi vào Nhật ký hệ thống). */
const MaskedField = ({ label, value, onReveal }: MaskedFieldProps) => {
  const [revealed, setRevealed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-subtle uppercase tracking-wide">{label}</span>
        {!revealed && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
          >
            <Eye size={12} />
            Xem nội dung
          </button>
        )}
      </div>

      <div className="rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-xs font-mono text-ink/90 whitespace-pre-wrap break-words min-h-[2.5rem]">
        {revealed ? value || '(trống)' : '•••••••••••••••••••••••••••••'}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xem nội dung nhạy cảm"
        message="Đây là nội dung yêu cầu/dự án của người dùng — hành động xem sẽ được ghi vào Nhật ký hệ thống kèm tên admin và thời gian. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xác nhận xem"
        danger
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setRevealed(true)
          setConfirmOpen(false)
          onReveal()
        }}
      />
    </div>
  )
}

export default MaskedField
