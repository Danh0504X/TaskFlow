import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, Plus } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import ProjectStatusBadge from '@/features/projects/components/ProjectStatusBadge'
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
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-xs font-bold text-muted hover:text-brand transition-all w-fit"
      >
        <ArrowLeft size={14} />
        <span>Quay lại danh sách dự án</span>
      </button>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line/20">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-brand/8 border border-brand/10 flex items-center justify-center text-brand font-extrabold text-lg shrink-0">
            {(project.key || project.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">{project.name}</h1>
              <ProjectMethodologyBadge methodology={project.methodology} />
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-muted mt-1.5 text-xs font-semibold leading-relaxed max-w-2xl">
              {project.description || 'Chưa có mô tả cho dự án này.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateIssueOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 self-start"
        >
          <Plus size={15} />
          <span>Thêm issue</span>
        </button>
      </header>

      <Tabs items={getTabItems(project.methodology)} value={activeTab} onChange={setActiveTab} className="w-fit" />

      <div className="flex-grow relative">
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

      <AnimatePresence>
        {selectedIssueKey && (
          <IssueDetailPanel
            issue={selectedIssue}
            projectId={project._id}
            isLoading={issuesLoading}
            onClose={() => setSelectedIssueKey(null)}
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
