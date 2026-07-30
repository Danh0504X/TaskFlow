import { Fragment, useMemo, useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { AiDraftIssue } from '../ai.types'
import { useAcceptDrafts } from '../hooks/useAcceptDrafts'
import { useRejectDrafts } from '../hooks/useRejectDrafts'
import { useDeleteDraft } from '../hooks/useDeleteDraft'
import DraftRow from './DraftRow'
import DraftEditModal from './DraftEditModal'
import AddDraftModal from './AddDraftModal'
import BulkActionBar from './BulkActionBar'

interface DraftTableProps {
  projectId: string
  generationId: string
  drafts: AiDraftIssue[]
}

/**
 * Bảng duyệt draft — cây Req->Epic (task con thụt vào dưới epic cha theo parentTempId),
 * tick đơn/chọn tất cả/chấp nhận/từ chối/sửa/thêm tay/xoá. Chống mồ côi bằng auto-sync 2 chiều:
 * tick task con -> tự tick epic cha; bỏ tick epic cha -> tự bỏ tick các task con (không cần
 * disable + tooltip vì bất biến này được giữ ngay từ khi thao tác, không có trạng thái vi phạm).
 */
const DraftTable = ({ projectId, generationId, drafts }: DraftTableProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingDraft, setEditingDraft] = useState<AiDraftIssue | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const acceptMutation = useAcceptDrafts(projectId, generationId)
  const rejectMutation = useRejectDrafts(projectId, generationId)
  const deleteMutation = useDeleteDraft(projectId, generationId)

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
  const epicOptions = drafts.filter((d) => d.type === 'EPIC')

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
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <p className="text-sm font-semibold text-ink">Chưa có draft nào</p>
        <p className="mt-1 text-xs text-subtle">
          AI chưa đề xuất được issue nào — thử "Thêm thủ công" hoặc sinh lại với requirement chi tiết hơn.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setAdding(true)}>
          Thêm thủ công
        </Button>
        <AddDraftModal
          open={adding}
          onClose={() => setAdding(false)}
          projectId={projectId}
          generationId={generationId}
          epicOptions={epicOptions}
        />
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

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            Thêm thủ công
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={acceptMutation.isPending}
            disabled={selectableTempIds.length === 0}
            onClick={handleAcceptAll}
          >
            Chấp nhận tất cả
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wider text-subtle">
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2">Loại</th>
              <th className="px-3 py-2">Tiêu đề</th>
              <th className="px-3 py-2">Ưu tiên</th>
              <th className="px-3 py-2">Phạm vi</th>
              <th className="px-3 py-2">Nguồn</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {tree.map(({ root, children }) => (
              <Fragment key={root._id}>
                <DraftRow
                  draft={root}
                  checked={selected.has(root.tempId)}
                  onToggle={() => toggle(root)}
                  onEdit={() => setEditingDraft(root)}
                  onDelete={() => setConfirmDeleteId(root._id)}
                />
                {children.map((child) => (
                  <DraftRow
                    key={child._id}
                    draft={child}
                    indent
                    checked={selected.has(child.tempId)}
                    onToggle={() => toggle(child)}
                    onEdit={() => setEditingDraft(child)}
                    onDelete={() => setConfirmDeleteId(child._id)}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          accepting={acceptMutation.isPending}
          rejecting={rejectMutation.isPending}
          onAccept={handleAcceptSelected}
          onReject={handleRejectSelected}
        />
      )}

      <DraftEditModal
        open={!!editingDraft}
        draft={editingDraft}
        onClose={() => setEditingDraft(null)}
        projectId={projectId}
        generationId={generationId}
      />

      <AddDraftModal
        open={adding}
        onClose={() => setAdding(false)}
        projectId={projectId}
        generationId={generationId}
        epicOptions={epicOptions}
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
