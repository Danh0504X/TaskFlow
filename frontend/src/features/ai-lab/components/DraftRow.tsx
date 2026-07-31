import { Layers, FileText, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/cn'
import Badge from '@/components/ui/Badge'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import type { AiDraftIssue } from '../ai.types'
import ScopePreviewPopover from './ScopePreviewPopover'

interface DraftRowProps {
  draft: AiDraftIssue
  checked: boolean
  indent?: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_STYLE: Record<AiDraftIssue['status'], { label: string; className: string }> = {
  SUGGESTED: { label: 'Chờ duyệt', className: 'bg-pastel-blue text-pastel-blue-ink' },
  ACCEPTED: { label: 'Đã tạo', className: 'bg-pastel-green text-pastel-green-ink' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-pastel-red text-pastel-red-ink' },
}

/** 1 dòng trong DraftTable — Epic gốc hoặc Task con (thụt vào khi `indent`). */
const DraftRow = ({ draft, checked, indent, onToggle, onEdit, onDelete }: DraftRowProps) => {
  const editable = draft.status === 'SUGGESTED'
  const deletable = draft.status !== 'ACCEPTED'
  const status = STATUS_STYLE[draft.status]

  return (
    <tr className="border-b border-hairline last:border-0 hover:bg-canvas/60 transition-colors">
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={!editable}
          onChange={onToggle}
          className="h-4 w-4 cursor-pointer rounded border-hairline disabled:cursor-not-allowed disabled:opacity-40"
        />
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
          {draft.type === 'EPIC' ? (
            <Layers size={14} className="shrink-0 text-brand" />
          ) : (
            <FileText size={14} className="shrink-0 text-pastel-blue-ink" />
          )}
          {draft.type === 'EPIC' ? 'Epic' : 'Task'}
        </span>
      </td>
      <td className={cn('max-w-xs truncate px-3 py-2.5 text-ink', indent && 'pl-8')}>{draft.title}</td>
      <td className="px-3 py-2.5">
        <IssuePriorityBadge priority={draft.priority} showIcon={false} />
      </td>
      <td className="px-3 py-2.5">
        {draft.scopePreview.length > 0 ? (
          <ScopePreviewPopover lines={draft.scopePreview} />
        ) : (
          <span className="text-xs text-subtle">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <Badge color={draft.origin === 'AI' ? 'blue' : 'slate'}>{draft.origin === 'AI' ? 'AI' : 'Tay'}</Badge>
      </td>
      <td className="px-3 py-2.5">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', status.className)}>
          {status.label}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!editable}
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30"
            aria-label="Sửa draft"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            disabled={!deletable}
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-pastel-red hover:text-pastel-red-ink disabled:opacity-30"
            aria-label="Xoá draft"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default DraftRow
