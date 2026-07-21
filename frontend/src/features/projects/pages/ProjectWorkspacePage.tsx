import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, Plus } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import ProjectMethodologyBadge from '@/features/projects/components/ProjectMethodologyBadge'
import IssueDetailPanel from '@/features/issues/components/IssueDetailPanel'
import IssueCreateModal from '@/features/issues/components/IssueCreateModal'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useProject } from '../hooks/useProject'
import { PROJECT_METHODOLOGY, type ProjectMethodology } from '../project.types'
import ProjectSummaryTab from '../components/ProjectSummaryTab'
import ProjectListTab from '../components/ProjectListTab'
import KanbanBoardContainer from '../components/KanbanBoardContainer'
import ScrumBoardContainer from '../components/ScrumBoardContainer'
import BacklogView from '../components/BacklogView'

type WorkspaceTab = 'SUMMARY' | 'LIST' | 'BOARD' | 'BACKLOG'

// Backlog = quản lý Sprint -> chỉ có ý nghĩa với Scrum, Kanban không có Sprint nên ẩn tab này.
// Đây chỉ là tab nội bộ (không có URL riêng) -> không cần route guard, vì không có gì để
// gõ thẳng URL bypass; chặn thật vẫn nằm ở backend (ensureScrumProject trong sprintService.js).
const getTabItems = (methodology: ProjectMethodology): { value: WorkspaceTab; label: string }[] => [
  { value: 'SUMMARY', label: 'Tóm tắt' },
  { value: 'LIST', label: 'Danh sách' },
  { value: 'BOARD', label: 'Bảng (Board)' },
  ...(methodology === PROJECT_METHODOLOGY.SCRUM
    ? [{ value: 'BACKLOG' as const, label: 'Backlog' }]
    : []),
]

interface WorkspaceTabsProps {
  items: { value: WorkspaceTab; label: string }[]
  value: WorkspaceTab
  onChange: (value: WorkspaceTab) => void
}

/** Tabs điều hướng chính của trang project — kiểu gạch chân mỏng (Jira), không nền pill, chữ
 * nhỏ gọn. Tách riêng khỏi `Tabs.tsx` dùng chung (kiểu pill) vì đó vẫn đang phục vụ bộ lọc
 * ở trang "Công việc của tôi" — 2 ngữ cảnh khác nhau (điều hướng chính vs. bộ lọc). */
const WorkspaceTabs = ({ items, value, onChange }: WorkspaceTabsProps) => {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex items-center gap-5">
      {items.map((item) => {
        const isActive = value === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative pb-2.5 text-xs font-semibold transition-colors',
              isActive ? 'text-brand' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
            {isActive && (
              <motion.span
                layoutId="workspace-tab-underline"
                className="absolute left-0 right-0 -bottom-px h-[2px] bg-brand rounded-full"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

const ProjectWorkspacePage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(projectId)
  const reduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('SUMMARY')
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)

  // Dùng chung cache với các tab Summary/List/Board/Backlog (cùng queryKey) -> không
  // tốn thêm request, chỉ để tra ra issue đầy đủ cho panel chi tiết theo key đã chọn.
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(project?._id)
  const selectedIssue = issues?.find((issue) => issue.key === selectedIssueKey) ?? null

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted">Không tìm thấy dự án này.</p>
        <button onClick={() => navigate('/projects')} className="text-brand text-sm font-bold hover:underline">
          Quay lại danh sách dự án
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header cố định — không cuộn theo nội dung tab bên dưới. */}
      <header className="shrink-0 border-b border-line/20 bg-white/80 backdrop-blur-md px-6 md:px-8 pt-3">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-muted hover:text-brand transition-all w-fit mb-2"
        >
          <ArrowLeft size={12} />
          <span>Dự án của tôi</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand/8 border border-brand/10 flex items-center justify-center text-brand font-extrabold text-xs shrink-0">
              {(project.key || project.name).slice(0, 2).toUpperCase()}
            </div>
            <h1 className="text-lg md:text-xl font-bold text-ink tracking-tight truncate">{project.name}</h1>
            <ProjectMethodologyBadge methodology={project.methodology} />
          </div>

          <button
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white rounded-xl text-xs font-bold shadow-md shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} />
            <span>Thêm issue</span>
          </button>
        </div>

        <WorkspaceTabs items={getTabItems(project.methodology)} value={activeTab} onChange={setActiveTab} />
      </header>

      {/* Body — vùng cuộn DUY NHẤT của trang, header phía trên luôn đứng yên. */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {activeTab === 'SUMMARY' && <ProjectSummaryTab projectId={project._id} />}
                {activeTab === 'LIST' && <ProjectListTab projectId={project._id} onSelectIssue={setSelectedIssueKey} />}
                {activeTab === 'BOARD' && (
                  project.methodology === PROJECT_METHODOLOGY.SCRUM ? (
                    <ScrumBoardContainer
                      projectId={project._id}
                      onSelectIssue={setSelectedIssueKey}
                      onGoToBacklog={() => setActiveTab('BACKLOG')}
                    />
                  ) : (
                    <KanbanBoardContainer projectId={project._id} onSelectIssue={setSelectedIssueKey} />
                  )
                )}
                {activeTab === 'BACKLOG' && (
                  <BacklogView
                    projectId={project._id}
                    onSelectIssue={setSelectedIssueKey}
                    onGoToBoard={() => setActiveTab('BOARD')}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedIssueKey && (
          <IssueDetailPanel
            issue={selectedIssue}
            projectId={project._id}
            isLoading={issuesLoading}
            onClose={() => setSelectedIssueKey(null)}
            onSelectIssue={setSelectedIssueKey}
          />
        )}
      </AnimatePresence>

      <IssueCreateModal
        open={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        projectId={project._id}
        issues={issues ?? []}
      />
    </div>
  )
}

export default ProjectWorkspacePage