import { useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useCreateIssue } from '../hooks/useIssueMutations'

interface QuickAddIssueProps {
  projectId: string
  /** null = tạo thẳng vào Backlog. Có giá trị = tạo thẳng vào sprint đó luôn (backend
   * cho phép gán sprintId lúc tạo, miễn là sprint thuộc đúng project và còn PLANNED/ACTIVE). */
  targetSprintId: string | null
  /** orderIndex tính sẵn để đặt issue mới ở cuối danh sách của khung này. */
  nextOrderIndex: number
}

/**
 * Nút "+" thêm nhanh issue ở cuối mỗi khung sprint/backlog trong trang Backlog — chỉ nhập
 * title, mặc định type=TASK. Enter hoặc click ra ngoài đều tự lưu; title rỗng thì hủy,
 * quay lại nút "+". Sau khi tạo thành công, quay về nút "+" (issue mới đã nằm phía trên nó).
 */
const QuickAddIssue = ({ projectId, targetSprintId, nextOrderIndex }: QuickAddIssueProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const createMutation = useCreateIssue(projectId)

  const handleCommit = () => {
    // Chặn commit 2 lần (vd Enter xong rồi blur trước khi request hoàn tất).
    if (createMutation.isPending) return

    const trimmed = title.trim()
    if (!trimmed) {
      setIsAdding(false)
      setTitle('')
      return
    }

    createMutation.mutate(
      { title: trimmed, sprintId: targetSprintId, orderIndex: nextOrderIndex },
      {
        onSuccess: () => {
          setIsAdding(false)
          setTitle('')
        },
      },
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setTitle('')
    }
  }

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
    <input
      type="text"
      autoFocus
      value={title}
      disabled={createMutation.isPending}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      placeholder="Nhập tên issue rồi Enter..."
      className="w-full bg-white border border-brand/30 rounded-2xl px-3.5 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none disabled:opacity-60"
    />
  )
}

export default QuickAddIssue