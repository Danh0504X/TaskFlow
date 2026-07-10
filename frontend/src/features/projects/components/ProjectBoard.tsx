import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import BoardColumn from '@/features/issues/components/BoardColumn'

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
  // Board chỉ vận hành trên Task -> Epic chỉ là container tổ chức, hiển thị ở tab Danh sách.
  const { data: issues, isLoading } = useProjectIssues(projectId, { type: 'TASK' })
  const { query, setQuery, filtered } = useIssueSearch(issues)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-white/70 backdrop-blur-md rounded-2xl border border-line/30 shadow-sm">
        <SearchInput
          containerClassName="max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm trên bảng..."
        />
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
