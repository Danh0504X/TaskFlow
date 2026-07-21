import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useCreateIssue } from '../hooks/useIssueMutations'
import { ISSUE_TYPE, type IssueStatus, type IssueType } from '../issue.types'
import AssigneePicker from './AssigneePicker'
import IssueTypePicker from './IssueTypePicker'

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
    /** Cho chọn loại issue (Epic/Task) ngay trong khung — dùng ở trang Danh sách (tạo issue gốc,
   * không thuộc sprint/cột nào cụ thể). Board/Backlog không cần vì ngữ cảnh đã ngầm định Task. */
  allowTypeSelection?: boolean
}

/**
 * Nút "+" thêm nhanh issue ở cuối mỗi khung sprint/backlog/cột Board/danh sách — nhập title +
 * tuỳ chọn gán người thực hiện và/hoặc loại issue (Epic/Task) ngay cùng lúc tạo.
 *
  * Lưu khi: Enter, click ra ngoài khung, HOẶC chọn xong 1 trong 2 dropdown (assignee/type).
 * Vì các dropdown này render qua Portal (ngoài DOM của khung), lúc bấm chọn, trình duyệt bắn
 * `blur` (relatedTarget trỏ vào phần tử trong Portal, không thuộc khung) TRƯỚC khi bắn `click`
 * chọn — nếu chỉ dựa vào blur, khung sẽ tự lưu SỚM với giá trị cũ (chưa kịp chọn) rồi chặn
 * luôn lần lưu đúng phía sau (do đang pending). `anyPickerOpen` (báo qua onOpenChange của từng
 * dropdown) dùng để chặn hẳn việc tự lưu qua blur trong lúc 1 trong 2 dropdown đang mở; commit
 * thật sự khi chọn xong nằm ở `handleAssigneeChange`/`handleTypeChange` (dùng giá trị vừa chọn
 * trực tiếp, không qua state, tránh closure cũ).
 */
const QuickAddIssue = ({ projectId, targetSprintId, nextOrderIndex, status, allowTypeSelection = false }: QuickAddIssueProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [type, setType] = useState<IssueType>(ISSUE_TYPE.TASK)
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false)
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
  const anyPickerOpen = isAssigneePickerOpen || isTypePickerOpen
  const rowRef = useRef<HTMLDivElement>(null)
  // silent: bỏ toast "Tạo issue thành công" -> thêm nhanh liên tục không bị dồn thông báo,
  // mượt hơn (issue mới xuất hiện ngay trong khung là đủ phản hồi rồi, không cần toast).
  const createMutation = useCreateIssue(projectId, { silent: true })

  const reset = () => {
    setIsAdding(false)
    setTitle('')
    setAssigneeId(null)
    setType(ISSUE_TYPE.TASK)
  }

  // Nhận assignee/type qua tham số thay vì đọc lại state -> tránh closure cũ khi gọi ngay
  // sau khi chọn trong dropdown (setState chưa kịp áp dụng ở lần gọi đó).
  //
  // `cancelIfEmpty`: phân biệt 2 loại lời gọi khi title đang rỗng —
  // - true (Enter, click ra ngoài thật): coi như người dùng bỏ dở -> hủy khung (reset).
  // - false (vừa chọn xong 1 dropdown): người dùng có thể mới chọn assignee/type TRƯỚC khi
  //   gõ title -> chỉ giữ lại lựa chọn, KHÔNG hủy khung, để họ gõ title tiếp sau đó.
  const commit = (currentAssigneeId: string | null, currentType: IssueType, cancelIfEmpty: boolean) => {
    // Chặn commit 2 lần (vd Enter xong rồi blur trước khi request hoàn tất).
    if (createMutation.isPending) return

    const trimmed = title.trim()
    if (!trimmed) {
      if (cancelIfEmpty) reset()
      return
    }

    createMutation.mutate(
      {
        title: trimmed,
        sprintId: targetSprintId,
        orderIndex: nextOrderIndex,
        status,
        assigneeId: currentAssigneeId,
        type: allowTypeSelection ? currentType : undefined,
      },
      { onSuccess: reset },
    )
  }

  const handleAssigneeChange = (userId: string | null) => {
    setAssigneeId(userId)
    // Có title rồi thì lưu luôn; chưa có thì chỉ giữ lại lựa chọn, không hủy khung.
    commit(userId, type, false)
  }

  const handleTypeChange = (nextType: IssueType) => {
    setType(nextType)
    // Có title rồi thì lưu luôn; chưa có thì chỉ giữ lại lựa chọn, không hủy khung.
    commit(assigneeId, nextType, false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(assigneeId, type, true)
    } else if (e.key === 'Escape') {
      reset()
    }
  }

  // Đang mở 1 trong 2 dropdown (portal) thì đừng tự lưu/hủy qua blur — commit thật đã được
  // handleAssigneeChange/handleTypeChange lo khi chọn xong; còn nếu bấm ra ngoài toàn bộ (kể cả
  // dropdown) mà chưa chọn gì, dropdown tự đóng và effect bên dưới sẽ xử lý tiếp.
  const handleRowBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (anyPickerOpen) return
    if (!rowRef.current?.contains(e.relatedTarget as Node)) {
      commit(assigneeId, type, true)
    }
  }

  // Dropdown vừa đóng (chọn xong hoặc bấm ra ngoài không chọn gì) mà focus cũng không còn nằm
  // trong khung nữa -> có thể là "chọn xong" (title vẫn đang rỗng, không được hủy) hoặc "bấm
  // ra ngoài không chọn gì" (không phân biệt được 2 trường hợp này chỉ từ vị trí focus) -> chọn
  // phương án an toàn hơn: không tự hủy ở đây (cancelIfEmpty=false), chỉ tự lưu nếu đã có title.
  const wasPickerOpenRef = useRef(false)
  useEffect(() => {
    if (wasPickerOpenRef.current && !anyPickerOpen && !rowRef.current?.contains(document.activeElement)) {
      commit(assigneeId, type, false)
    }
    wasPickerOpenRef.current = anyPickerOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyPickerOpen])

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
      {allowTypeSelection && (
        <IssueTypePicker value={type} onChange={handleTypeChange} onOpenChange={setIsTypePickerOpen} />
      )}
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
        onOpenChange={setIsAssigneePickerOpen}
        size={30}
      />
    </div>
  )
}

export default QuickAddIssue