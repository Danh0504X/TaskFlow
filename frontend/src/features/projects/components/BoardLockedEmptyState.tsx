import { Lock } from 'lucide-react'

interface BoardLockedEmptyStateProps {
  onGoToBacklog: () => void
}

/** Hiển thị khi project SCRUM chưa có sprint nào đang chạy — Board bị khóa, không kéo-thả được. */
const BoardLockedEmptyState = ({ onGoToBacklog }: BoardLockedEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center bg-white/70 border border-dashed border-line/40 rounded-3xl">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-line/20 flex items-center justify-center text-muted">
        <Lock size={22} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-ink">Chưa có sprint nào đang chạy</p>
        <p className="text-xs text-muted font-semibold">Hãy bắt đầu một sprint từ Backlog để mở khóa Board.</p>
      </div>
      <button
        onClick={onGoToBacklog}
        className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95"
      >
        Đi tới Backlog
      </button>
    </div>
  )
}

export default BoardLockedEmptyState
