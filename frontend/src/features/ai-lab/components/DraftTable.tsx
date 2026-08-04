import { Fragment, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CheckSquare, Plus, Square } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { AiDraftIssue, AiDraftType } from '../ai.types'
import { useAcceptDrafts } from '../hooks/useAcceptDrafts'
import { useRejectDrafts } from '../hooks/useRejectDrafts'
import { useDeleteDraft } from '../hooks/useDeleteDraft'
import { useEditDraft } from '../hooks/useEditDraft'
import { useAddDraft } from '../hooks/useAddDraft'
import DraftRow from './DraftRow'
import DraftEditModal from './DraftEditModal'
import AddDraftModal from './AddDraftModal'
import BulkActionBar from './BulkActionBar'

interface DraftTableProps {
  projectId: string
  generationId: string
  drafts: AiDraftIssue[]
}

interface QuickAddRowProps {
  defaultType: AiDraftType
  pending: boolean
  onSubmit: (title: string) => void
}

/** Hàng "+" thêm nhanh ở cuối bảng — bấm + hiện input, Enter tạo NGAY và GIỮ input mở/focus để
 * gõ tiếp món kế tiếp (không cần bấm + lại mỗi lần) — cùng cơ chế với SubtaskQuickAdd đã dùng
 * ở IssueDetailPanel, chỉ khác domain (draft AI thay vì subtask thật). */
const QuickAddRow = ({ defaultType, pending, onSubmit }: QuickAddRowProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => {
    const trimmed = value.trim()
    if (!trimmed || pending) return
    onSubmit(trimmed)
    setValue('')
    // Giữ input mở + focus để gõ tiếp ngay, không cần bấm "+" lại.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setValue('')
    }
  }

  if (!isAdding) {
    return (
      <tr>
        <td colSpan={8} className="px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setIsAdding(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand transition-colors"
          >
            <Plus size={14} /> Thêm {defaultType === 'EPIC' ? 'epic' : 'task'} nhanh
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td colSpan={8} className="px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={value}
            disabled={pending}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!value.trim()) setIsAdding(false)
            }}
            placeholder={`Tên ${defaultType === 'EPIC' ? 'epic' : 'task'} mới, Enter để thêm...`}
            className="flex-1 min-w-0 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/15 focus:border-ink/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={commit}
            disabled={!value.trim() || pending}
            className="shrink-0 rounded-lg bg-pastel-blue p-1.5 text-pastel-blue-ink transition-colors hover:bg-ink hover:text-canvas disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
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

  const acceptMutation = useAcceptDrafts(projectId, generationId)
  const rejectMutation = useRejectDrafts(projectId, generationId)
  const deleteMutation = useDeleteDraft(projectId, generationId)
  const editMutation = useEditDraft(projectId, generationId)
  const addMutation = useAddDraft(projectId, generationId)

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
  // Suy ra loại mặc định cho hàng "thêm nhanh": mẻ có epic (REQ_TO_EPIC) -> thêm epic mới;
  // mẻ toàn task (EPIC_TO_TASK) -> thêm task mới.
  const quickAddDefaultType: AiDraftType = epicOptions.length > 0 || drafts.length === 0 ? 'EPIC' : 'TASK'

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

  const handleQuickAdd = (title: string) => {
    addMutation.mutate({ title, type: quickAddDefaultType, priority: 'MEDIUM' })
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

      {/* max-h + overflow-y-auto: bảng dài (nhiều task) tự cuộn dọc BÊN TRONG chính nó, không
          kéo dài cả modal/trang — thead sticky để vẫn thấy tên cột khi đã cuộn xuống dưới. */}
      <div className="max-h-[380px] overflow-x-auto overflow-y-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
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
                  onQuickRename={(title) => editMutation.mutate({ draftId: root._id, payload: { title } })}
                  onDelete={() => deleteMutation.mutate(root._id)}
                />
                {children.map((child) => (
                  <DraftRow
                    key={child._id}
                    draft={child}
                    indent
                    checked={selected.has(child.tempId)}
                    onToggle={() => toggle(child)}
                    onEdit={() => setEditingDraft(child)}
                    onQuickRename={(title) => editMutation.mutate({ draftId: child._id, payload: { title } })}
                    onDelete={() => deleteMutation.mutate(child._id)}
                  />
                ))}
              </Fragment>
            ))}
            <QuickAddRow defaultType={quickAddDefaultType} pending={addMutation.isPending} onSubmit={handleQuickAdd} />
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
        parentTitle={editingDraft?.parentTempId ? byTempId.get(editingDraft.parentTempId)?.title : null}
        childTitles={
          editingDraft?.type === 'EPIC'
            ? drafts.filter((d) => d.parentTempId === editingDraft.tempId).map((d) => d.title)
            : []
        }
      />

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

export default DraftTable
