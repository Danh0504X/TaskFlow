import { useState } from 'react'
import { Search } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import BoardColumn from './BoardColumn'

interface ProjectBoardProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

const COLUMNS = [
  { status: 'TODO', title: 'Cần làm' },
  { status: 'IN_PROGRESS', title: 'Đang tiến hành' },
  { status: 'IN_REVIEW', title: 'Đang đánh giá' },
  { status: 'DONE', title: 'Hoàn thành' },
] as const

const ProjectBoard = ({ projectId, onSelectIssue }: ProjectBoardProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = (issues ?? []).filter(
    (issue) =>
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-white/70 backdrop-blur-md rounded-2xl border border-line/30 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trên bảng..."
            className="w-full bg-slate-50 border border-line/20 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-muted">
          <Spinner />
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              title={col.title}
              status={col.status}
              issues={filtered.filter((issue) => issue.status === col.status)}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectBoard
