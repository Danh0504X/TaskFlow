import { Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BulkActionBarProps {
  count: number
  accepting?: boolean
  rejecting?: boolean
  onAccept: () => void
  onReject: () => void
}

/** Thanh hành động hàng loạt — hiện khi có ít nhất 1 draft được tick. */
const BulkActionBar = ({ count, accepting, rejecting, onAccept, onReject }: BulkActionBarProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-brand/25 bg-canvas px-4 py-2.5">
      <p className="text-xs font-semibold text-ink">Đã chọn {count} draft</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" loading={rejecting} onClick={onReject}>
          <X size={14} /> Từ chối đã chọn
        </Button>
        <Button variant="primary" size="sm" loading={accepting} onClick={onAccept}>
          <Check size={14} /> Chấp nhận đã chọn
        </Button>
      </div>
    </div>
  )
}

export default BulkActionBar
