import { useRef, useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'

interface AddDraftQuickAddProps {
  /** "Epic" hoặc "Task" — quyết định chữ hiển thị ("Thêm {label}", "Tên {label} — Enter để
   * thêm..."). DraftTable truyền đúng loại phù hợp với bối cảnh đang hiển thị (cây Epic-Task hay
   * danh sách Task phẳng của 1 epic thật) — xem manualAdd ở đó. */
  label: string
  onSubmit: (title: string) => void
  pending?: boolean
}

/** Khung "+" — bấm vào mới hiện ô nhập tên, Enter để thêm nhanh (ưu tiên mặc định Trung bình,
 * xem DraftTable.tsx). Escape/click ra ngoài huỷ, không thêm gì. */
const AddDraftQuickAdd = ({ label, onSubmit, pending }: AddDraftQuickAddProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startAdding = () => {
    setValue('')
    setIsAdding(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const cancel = () => {
    setIsAdding(false)
    setValue('')
  }

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed && !pending) onSubmit(trimmed)
    cancel()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      cancel()
    }
  }

  if (isAdding) {
    return (
      <input
        ref={inputRef}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={cancel}
        placeholder={`Tên ${label} — Enter để thêm...`}
        className="w-full rounded-md border border-ink/20 bg-surface px-2.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startAdding}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline p-2 text-xs font-semibold text-muted transition-colors hover:border-ink/25 hover:bg-canvas hover:text-ink"
    >
      <Plus size={13} />
      Thêm {label}
    </button>
  )
}

export default AddDraftQuickAdd
