import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useCreateIssue } from '../hooks/useIssueMutations'
import type { IssueStatus } from '../issue.types'
import AssigneePicker from './AssigneePicker'

interface QuickAddIssueProps {
  projectId: string
  /** null = tạo thẳng vào Backlog. Có giá trị = tạo thẳng vào sprint đó luôn (backend
   * cho phép gán sprintId lúc tạo, miễn là sprint thuộc đúng project và còn PLANNED/ACTIVE —
   * kể cả sprint đang ACTIVE, dùng cho quick-add ngay trên Board). */
  targetSprintId: string | null
  /** orderIndex tính sẵn để đặt issue mới ở cuối danh sách của khung này. */
  nextOrderIndex: number
  /** Status gán sẵn cho issue mới — dùng khi quick-add ngay trong 1 cột Board (vd cột "Đang
   * làm" thì issue mới vào thẳng IN_PROGRESS). Bỏ trống -> backend mặc định TODO. */
  status?: IssueStatus
}

/**
 * Nút "+" thêm nhanh issue ở cuối mỗi khung sprint/backlog/cột Board — nhập title + tuỳ chọn
 * gán người thực hiện ngay (AssigneePicker) cùng lúc tạo.
 *
 * Lưu khi: Enter, click ra ngoài khung, HOẶC chọn xong người thực hiện. Vì AssigneePicker
 * render qua Portal (ngoài DOM của khung này), lúc bấm chọn 1 người, trình duyệt bắn `blur`
 * (relatedTarget trỏ vào phần tử trong Portal, không thuộc khung) TRƯỚC khi bắn `click` chọn
 * người — nếu chỉ dựa vào blur, khung sẽ tự lưu SỚM với assigneeId cũ (chưa kịp chọn) rồi
 * chặn luôn lần lưu đúng phía sau (do đang pending). `isPickerOpen` (báo qua onOpenChange)
 * dùng để chặn hẳn việc tự lưu qua blur trong lúc dropdown đang mở; commit thật sự khi chọn
 * xong nằm ở `handleAssigneeChange` (dùng giá trị vừa chọn trực tiếp, không qua state).
 */
const QuickAddIssue = ({ projectId, targetSprintId, nextOrderIndex, status }: QuickAddIssueProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  // silent: bỏ toast "Tạo issue thành công" -> thêm nhanh liên tục không bị dồn thông báo,
  // mượt hơn (issue mới xuất hiện ngay trong khung là đủ phản hồi rồi, không cần toast).
  const createMutation = useCreateIssue(projectId, { silent: true })

  const reset = () => {
    setIsAdding(false)
    setTitle('')
    setAssigneeId(null)
  }

  // Nhận `assigneeId` qua tham số thay vì đọc lại state -> tránh closure cũ khi gọi ngay
  // sau khi chọn trong AssigneePicker (setAssigneeId chưa kịp áp dụng ở lần gọi đó).
  const commit = (currentAssigneeId: string | null) => {    
    // Chặn commit 2 lần (vd Enter xong rồi blur trước khi request hoàn tất).
    if (createMutation.isPending) return

    const trimmed = title.trim()
    if (!trimmed) {
      reset()
      return
    }

    createMutation.mutate(
      { title: trimmed, sprintId: targetSprintId, orderIndex: nextOrderIndex, status, assigneeId: currentAssigneeId },
      { onSuccess: reset },
    )
  }

  const handleAssigneeChange = (userId: string | null) => {
    setAssigneeId(userId)
    // Chọn xong người thực hiện coi như đã hoàn tất nhập liệu -> lưu ngay với giá trị vừa chọn.
    commit(userId)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(assigneeId)
    } else if (e.key === 'Escape') {
      reset()
    }
  }

  // Đang mở AssigneePicker (portal) thì đừng tự lưu qua blur — commit thật đã được
  // handleAssigneeChange lo khi chọn xong; còn nếu bấm ra ngoài toàn bộ (kể cả dropdown) mà
  // chưa chọn gì, AssigneePicker tự đóng và effect bên dưới sẽ commit lại theo state hiện có.
  const handleRowBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (isPickerOpen) return
    if (!rowRef.current?.contains(e.relatedTarget as Node)) {
      commit(assigneeId)
    }
  }

  // Dropdown vừa đóng (chọn xong hoặc bấm ra ngoài không chọn gì) mà focus cũng không còn
  // nằm trong khung nữa -> coi như đã "click ra ngoài" toàn bộ khung, tự lưu/hủy theo state
  // hiện tại. Nếu vừa chọn xong, commit ở đây chỉ là gọi thừa (bị chặn bởi guard isPending).
  const wasPickerOpenRef = useRef(false)
  useEffect(() => {
    if (wasPickerOpenRef.current && !isPickerOpen && !rowRef.current?.contains(document.activeElement)) {
      commit(assigneeId)
    }
    wasPickerOpenRef.current = isPickerOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPickerOpen])

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-line/40 rounded-2xl text-subtle hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-all"
      >
        <Plus size={16} />
        <span className="text-xs font-semibold">Thêm issue</span>
      </button>
    )
  }

  return (
    <div ref={rowRef} onBlur={handleRowBlur} className="flex items-center gap-2">
      <input
        type="text"
        autoFocus
        value={title}
        disabled={createMutation.isPending}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tên issue rồi Enter..."
        className="flex-1 min-w-0 bg-white border border-brand/30 rounded-2xl px-3.5 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none disabled:opacity-60"
      />
      <AssigneePicker
        projectId={projectId}
        value={assigneeId}
        onChange={handleAssigneeChange}
        onOpenChange={setIsPickerOpen}
        size={30}
      />
    </div>
  )
}

export default QuickAddIssue