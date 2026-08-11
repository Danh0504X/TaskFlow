import { useMemo, useState } from 'react'
import { Check, CheckSquare, Square, Trash2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { AiDraftIssue } from '../ai.types'
import { useAcceptDrafts } from '../hooks/useAcceptDrafts'
import { useRejectDrafts } from '../hooks/useRejectDrafts'
import { useDeleteDraft } from '../hooks/useDeleteDraft'
import { useAddDraft } from '../hooks/useAddDraft'
import DraftRow from './DraftRow'
import DraftEditModal from './DraftEditModal'
import AddEpicQuickAdd from './AddEpicQuickAdd'

interface DraftTableProps {
  projectId: string
  generationId: string
  drafts: AiDraftIssue[]
}

const iconButtonClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Bảng duyệt draft — cây Req->Epic (task con thụt vào dưới epic cha theo parentTempId),
 * chọn đơn (bấm bất kỳ đâu trên card, xem DraftRow.tsx)/chọn tất cả/chấp nhận/từ chối/sửa/thêm
 * tay/xoá. Chống mồ côi bằng auto-sync 2 chiều: chọn task con -> tự chọn epic cha; bỏ chọn epic
 * cha -> tự bỏ chọn các task con (không cần disable + tooltip vì bất biến này được giữ ngay từ
 * khi thao tác, không có trạng thái vi phạm).
 *
 * Thanh hành động gộp chung vào đầu mục (cạnh "Chọn tất cả"): chưa chọn gì thì hiện 1 icon
 * "Chấp nhận tất cả"; vừa chọn thì icon đó được thay bằng nhãn "Đã chọn N" + 2 icon (từ chối/
 * chấp nhận đã chọn) — không còn thanh hành động rời ở cuối danh sách.
 */
const DraftTable = ({ projectId, generationId, drafts }: DraftTableProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingDraft, setEditingDraft] = useState<AiDraftIssue | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const acceptMutation = useAcceptDrafts(projectId, generationId)
  const rejectMutation = useRejectDrafts(projectId, generationId)
  const deleteMutation = useDeleteDraft(projectId, generationId)
  const addMutation = useAddDraft(projectId, generationId)

  const handleQuickAddEpic = (title: string) => {
    addMutation.mutate({ title, type: 'EPIC', priority: 'MEDIUM' })
  }

  const byTempId = useMemo(() => new Map(drafts.map((d) => [d.tempId, d])), [drafts])

  const tree = useMemo(() => {
    const roots = drafts.filter((d) => !d.parentTempId)
    return roots.map((root) => ({
      root,
      children: drafts.filter((d) => d.parentTempId === root.tempId),
    }))
  }, [drafts])

  const selectableTempIds = useMemo(
    () => drafts.filter((d) => d.status === 'SUGGESTED').map((d) => d.tempId),
    [drafts],
  )

  const toggle = (draft: AiDraftIssue) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const isChecking = !next.has(draft.tempId)

      if (isChecking) {
        next.add(draft.tempId)
        if (draft.parentTempId && byTempId.get(draft.parentTempId)?.status === 'SUGGESTED') {
          next.add(draft.parentTempId)
        }
      } else {
        next.delete(draft.tempId)
        if (draft.type === 'EPIC') {
          drafts.filter((d) => d.parentTempId === draft.tempId).forEach((child) => next.delete(child.tempId))
        }
      }
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.size === selectableTempIds.length ? new Set() : new Set(selectableTempIds)))
  }

  const selectedDraftIds = drafts.filter((d) => selected.has(d.tempId)).map((d) => d._id)

  const handleAcceptAll = () => {
    if (selectableTempIds.length === 0) return
    acceptMutation.mutate(selectableTempIds, { onSuccess: () => setSelected(new Set()) })
  }

  const handleAcceptSelected = () => {
    acceptMutation.mutate(Array.from(selected), { onSuccess: () => setSelected(new Set()) })
  }

  const handleRejectSelected = () => {
    rejectMutation.mutate(selectedDraftIds, { onSuccess: () => setSelected(new Set()) })
  }

  if (drafts.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-hairline bg-surface p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">Chưa có draft nào</p>
          <p className="mt-1 text-xs text-subtle">
            AI chưa đề xuất được issue nào — thử thêm Epic bên dưới hoặc sinh lại với requirement chi tiết hơn.
          </p>
        </div>
        <div className="mx-auto max-w-xs text-left">
          <AddEpicQuickAdd onSubmit={handleQuickAddEpic} pending={addMutation.isPending} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleAll}
          disabled={selectableTempIds.length === 0}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-40"
        >
          {selected.size > 0 && selected.size === selectableTempIds.length ? (
            <CheckSquare size={16} className="text-brand" />
          ) : (
            <Square size={16} />
          )}
          Chọn tất cả ({selectableTempIds.length})
        </button>

        {selected.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Đã chọn {selected.size}</span>
            <button
              type="button"
              title="Từ chối đã chọn"
              aria-label="Từ chối đã chọn"
              disabled={rejectMutation.isPending}
              onClick={handleRejectSelected}
              className={`${iconButtonClass} border border-hairline text-muted hover:bg-pastel-red hover:text-pastel-red-ink`}
            >
              {rejectMutation.isPending ? <Spinner /> : <Trash2 size={14} />}
            </button>
            <button
              type="button"
              title="Chấp nhận đã chọn"
              aria-label="Chấp nhận đã chọn"
              disabled={acceptMutation.isPending}
              onClick={handleAcceptSelected}
              className={`${iconButtonClass} bg-ink text-canvas hover:bg-[#e4e4e5]`}
            >
              {acceptMutation.isPending ? <Spinner /> : <Check size={14} />}
            </button>
          </div>
        ) : (
          <button
            type="button"
            title="Chấp nhận tất cả"
            aria-label="Chấp nhận tất cả"
            disabled={selectableTempIds.length === 0 || acceptMutation.isPending}
            onClick={handleAcceptAll}
            className={`${iconButtonClass} bg-ink text-canvas hover:bg-[#e4e4e5]`}
          >
            {acceptMutation.isPending ? <Spinner /> : <Check size={14} />}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <AddEpicQuickAdd onSubmit={handleQuickAddEpic} pending={addMutation.isPending} />

        {tree.map(({ root, children }) => (
          <div key={root._id} className="space-y-1">
            <DraftRow
              draft={root}
              checked={selected.has(root.tempId)}
              onToggle={() => toggle(root)}
              onEdit={() => setEditingDraft(root)}
              onDelete={() => setConfirmDeleteId(root._id)}
            />
            {children.length > 0 && (
              <div className="ml-4 space-y-1 border-l-2 border-hairline pl-2.5">
                {children.map((child) => (
                  <DraftRow
                    key={child._id}
                    draft={child}
                    nested
                    checked={selected.has(child.tempId)}
                    onToggle={() => toggle(child)}
                    onEdit={() => setEditingDraft(child)}
                    onDelete={() => setConfirmDeleteId(child._id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <DraftEditModal
        open={!!editingDraft}
        draft={editingDraft}
        onClose={() => setEditingDraft(null)}
        projectId={projectId}
        generationId={generationId}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Xoá draft"
        message="Bạn có chắc muốn xoá draft này? Hành động không thể hoàn tác."
        danger
        loading={deleteMutation.isPending}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (!confirmDeleteId) return
          deleteMutation.mutate(confirmDeleteId, { onSuccess: () => setConfirmDeleteId(null) })
        }}
      />
    </div>
  )
}

export default DraftTable
