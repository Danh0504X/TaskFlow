import { Lock } from 'lucide-react'

interface BoardLockedEmptyStateProps {
  onGoToBacklog: () => void
}

/** Hiển thị khi project SCRUM chưa có sprint nào đang chạy — Board bị khóa, không kéo-thả được. */
const BoardLockedEmptyState = ({ onGoToBacklog }: BoardLockedEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center bg-surface border border-dashed border-hairline rounded-lg">
      <div className="w-14 h-14 rounded-lg bg-pastel-blue flex items-center justify-center text-pastel-blue-ink">
        <Lock size={22} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Chưa có sprint nào đang chạy</p>
        <p className="text-xs text-muted">Hãy bắt đầu một sprint từ Backlog để mở khóa Board.</p>
      </div>
      <button
        onClick={onGoToBacklog}
        className="px-4 py-2.5 bg-ink text-canvas rounded-lg text-xs font-semibold hover:bg-[#e4e4e5] transition-colors active:scale-[0.98]"
      >
        Đi tới Backlog
      </button>
    </div>
  )
}

export default BoardLockedEmptyState
