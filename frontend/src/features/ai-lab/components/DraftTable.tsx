import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, CheckSquare, Square, Trash2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast/toastStore'
import type { AiDraftIssue, AiGenerationStatus } from '../ai.types'
import { aiKeys } from '../ai.keys'
import { reportAiFailure } from '../ai.utils'
import { useAcceptDrafts } from '../hooks/useAcceptDrafts'
import { useRejectDrafts } from '../hooks/useRejectDrafts'
import { useDeleteDraft } from '../hooks/useDeleteDraft'
import { useAddDraft } from '../hooks/useAddDraft'
import { useCreateGeneration } from '../hooks/useCreateGeneration'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
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

// Draft còn chờ duyệt đứng trước — đây là những dòng PM còn phải quyết định, ưu tiên nhìn thấy
// ngay. Đã duyệt (ACCEPTED) hoặc bị từ chối (REJECTED) coi như đã "xong việc", đẩy xuống dưới để
// đỡ rối — nhưng KHÔNG ẩn hẳn, PM vẫn cuộn xuống xem lại được. Sort ổn định (Array.sort chuẩn
// ES2019+) nên giữ nguyên thứ tự tạo (createdAt) trong từng nhóm.
const statusSortWeight = (status: AiDraftIssue['status']) => (status === 'SUGGESTED' ? 0 : 1)
const byStatusThenCreated = (a: AiDraftIssue, b: AiDraftIssue) =>
  statusSortWeight(a.status) - statusSortWeight(b.status)

interface TaskTurnWatcherProps {
  projectId: string
  turnId: string
  onSettled: (status: AiGenerationStatus, errorMessage: string | null) => void
}

/** Poll ngầm 1 turn "Sinh Task cho epic nháp" tới khi xong (COMPLETED/FAILED) rồi báo cho
 * DraftTable gỡ trạng thái loading + biết rõ thành công hay thất bại (để báo toast) — không
 * render gì, thuần logic. Tách riêng khỏi component chính vì mỗi epic đang sinh task cần 1 vòng
 * poll độc lập (không thể gọi hook trong loop). */
const TaskTurnWatcher = ({ projectId, turnId, onSettled }: TaskTurnWatcherProps) => {
  const { data } = useGenerationPolling(projectId, turnId)

  useEffect(() => {
    if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
      onSettled(data.status, data.errorMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status])

  return null
}

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
 *
 * Epic (còn SUGGESTED) có thêm nút "Sinh Task bằng AI" ngay trên hàng của nó — tạo 1 turn mới
 * gắn `parentGenerationId` = phiên đang xem (prop `generationId`, luôn là gốc phiên ở 2 nơi gọi
 * component này — xem AiGenerateEpicModal/AiQuickGenerateModal), nên khi turn xong, task mới tự
 * lồng đúng dưới epic qua `parentTempId` mà không cần gộp dữ liệu thủ công ở FE. Trạng thái đang
 * sinh chỉ theo dõi CỤC BỘ cho đúng epic đó (`generatingEpics` map theo tempId) — epic khác không
 * bị ảnh hưởng, không có spinner load lại toàn bảng.
 */
const DraftTable = ({ projectId, generationId, drafts }: DraftTableProps) => {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingDraft, setEditingDraft] = useState<AiDraftIssue | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  // epic.tempId -> id turn "Sinh Task" đang chạy cho đúng epic đó.
  const [generatingEpics, setGeneratingEpics] = useState<Record<string, string>>({})
  // epic.tempId đang bị thu gọn (tạm ẩn task con) — chỉ ảnh hưởng hiển thị, không đổi dữ liệu.
  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set())

  const toggleCollapse = (epicTempId: string) => {
    setCollapsedEpics((prev) => {
      const next = new Set(prev)
      if (next.has(epicTempId)) next.delete(epicTempId)
      else next.add(epicTempId)
      return next
    })
  }

  const acceptMutation = useAcceptDrafts(projectId, generationId)
  const rejectMutation = useRejectDrafts(projectId, generationId)
  const deleteMutation = useDeleteDraft(projectId, generationId)
  const addMutation = useAddDraft(projectId, generationId)
  const generateTasksMutation = useCreateGeneration(projectId)

  const handleQuickAddEpic = (title: string) => {
    addMutation.mutate({ title, type: 'EPIC', priority: 'MEDIUM' })
  }

  const handleGenerateTasks = (epic: AiDraftIssue) => {
    if (generatingEpics[epic.tempId]) return

    generateTasksMutation.mutate(
      { generationType: 'EPIC_TO_TASK', sourceDraftId: epic._id, parentGenerationId: generationId },
      {
        onSuccess: (res) => {
          setGeneratingEpics((prev) => ({ ...prev, [epic.tempId]: res.generationId }))
        },
      },
    )
  }

  const handleTaskTurnSettled = (
    epicTempId: string,
    status: AiGenerationStatus,
    errorMessage: string | null,
  ) => {
    setGeneratingEpics((prev) => {
      if (!(epicTempId in prev)) return prev
      const next = { ...prev }
      delete next[epicTempId]
      return next
    })

    if (status === 'FAILED') {
      // Lỗi thật từ AI (vd hết quota, provider quá tải, model 503...) — reportAiFailure log ra
      // console cho dev debug, chỉ hiện câu chung chung cho PM (xem ai.utils.ts).
      toast.error(reportAiFailure(errorMessage))
    } else {
      toast.success('Đã sinh task cho epic')
    }

    // Nạp lại đúng query mà cả AiGenerateEpicModal lẫn AiQuickGenerateModal đang poll để hiện
    // task mới (COMPLETED) hoặc chỉ đơn giản đồng bộ lại (FAILED, không có gì mới để hiện).
    queryClient.invalidateQueries({ queryKey: aiKeys.generation(projectId, generationId) })
  }

  const byTempId = useMemo(() => new Map(drafts.map((d) => [d.tempId, d])), [drafts])

  const tree = useMemo(() => {
    const roots = drafts.filter((d) => !d.parentTempId).sort(byStatusThenCreated)
    return roots.map((root) => ({
      root,
      children: drafts.filter((d) => d.parentTempId === root.tempId).sort(byStatusThenCreated),
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

        {tree.map(({ root, children }) => {
          const activeTurnId = generatingEpics[root.tempId]
          const isCollapsed = collapsedEpics.has(root.tempId)
          const showChildren = children.length > 0 && !isCollapsed

          return (
            <div key={root._id} className="space-y-1">
              <DraftRow
                draft={root}
                checked={selected.has(root.tempId)}
                onToggle={() => toggle(root)}
                onEdit={() => setEditingDraft(root)}
                onDelete={() => setConfirmDeleteId(root._id)}
                onGenerateTasks={() => handleGenerateTasks(root)}
                generatingTasks={!!activeTurnId}
                childCount={children.length}
                collapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapse(root.tempId)}
              />
              {(showChildren || activeTurnId) && (
                <div className="ml-4 space-y-1 border-l-2 border-hairline pl-2.5">
                  {showChildren &&
                    children.map((child) => (
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
                  {activeTurnId && (
                    <div className="flex items-center gap-2 rounded-md border border-dashed border-hairline bg-canvas/40 px-2.5 py-2 text-xs font-medium text-subtle">
                      <Spinner className="h-3.5 w-3.5" />
                      Đang sinh task cho epic này...
                      <TaskTurnWatcher
                        projectId={projectId}
                        turnId={activeTurnId}
                        onSettled={(status, errorMessage) =>
                          handleTaskTurnSettled(root.tempId, status, errorMessage)
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
