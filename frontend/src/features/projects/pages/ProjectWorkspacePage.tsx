import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import ProjectStatusBadge from '@/features/projects/components/ProjectStatusBadge'
import IssueDetailPanel from '@/features/issues/components/IssueDetailPanel'
import { useProject } from '../hooks/useProject'
import ProjectSummaryTab from '../components/ProjectSummaryTab'
import ProjectListTab from '../components/ProjectListTab'
import ProjectBoard from '../components/ProjectBoard'
import ProjectBacklogTab from '../components/ProjectBacklogTab'

type WorkspaceTab = 'SUMMARY' | 'LIST' | 'BOARD' | 'BACKLOG'

const tabItems: { value: WorkspaceTab; label: string }[] = [
  { value: 'SUMMARY', label: 'Tóm tắt' },
  { value: 'LIST', label: 'Danh sách' },
  { value: 'BOARD', label: 'Bảng (Board)' },
  { value: 'BACKLOG', label: 'Backlog' },
]

const ProjectWorkspacePage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(projectId)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('SUMMARY')
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null)

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
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-muted mt-1.5 text-xs font-semibold leading-relaxed max-w-2xl">
            {project.description || 'Chưa có mô tả cho dự án này.'}
          </p>
        </div>
      </header>

      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} className="w-fit" />

      <div className="flex-grow">
        {activeTab === 'SUMMARY' && <ProjectSummaryTab projectId={project._id} />}
        {activeTab === 'LIST' && <ProjectListTab projectId={project._id} onSelectIssue={setSelectedIssueKey} />}
        {activeTab === 'BOARD' && <ProjectBoard projectId={project._id} onSelectIssue={setSelectedIssueKey} />}
        {activeTab === 'BACKLOG' && <ProjectBacklogTab projectId={project._id} onSelectIssue={setSelectedIssueKey} />}
      </div>

      {selectedIssueKey && (
        <>
          <div
            onClick={() => setSelectedIssueKey(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />
          <IssueDetailPanel issueKey={selectedIssueKey} onClose={() => setSelectedIssueKey(null)} />
        </>
      )}
    </div>
  )
}

export default ProjectWorkspacePage
