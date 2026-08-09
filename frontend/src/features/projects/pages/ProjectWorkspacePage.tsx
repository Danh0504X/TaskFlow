import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, Plus, Sparkles, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import ProjectInviteModal from '../components/ProjectInviteModal'
import ProjectMembersModal from '../components/ProjectMembersModal'
import AiGenerateEpicModal from '@/features/ai-lab/components/AiGenerateEpicModal'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
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
import { recordProjectVisit } from '../recentProjects'

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
              isActive ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
            {isActive && (
              <motion.span
                layoutId="workspace-tab-underline"
                className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink rounded-full"
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
  const location = useLocation()
  const { data: project, isLoading } = useProject(projectId)
  const reduceMotion = useReducedMotion()
  // Cho phép điều hướng tới thẳng 1 tab cụ thể từ nơi khác (vd Dashboard -> Board của
  // project) qua navigate state — tab vẫn chỉ là state nội bộ, không có URL riêng (xem
  // comment ở getTabItems), nên đây là cách duy nhất "deep-link" vào 1 tab không phải SUMMARY.
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    (location.state as { initialTab?: WorkspaceTab } | null)?.initialTab ?? 'SUMMARY',
  )
  // Đổi state ngay trong lúc render (không dùng effect) để xử lý cả trường hợp component
  // không bị remount — vd bấm từ Dashboard sang project A rồi lại bấm sang project B trong
  // khi trang vẫn đang mở (React Router tái dùng cùng 1 instance vì chung route pattern).
  const [appliedNavState, setAppliedNavState] = useState(location.state)
  if (location.state !== appliedNavState) {
    setAppliedNavState(location.state)
    const initialTab = (location.state as { initialTab?: WorkspaceTab } | null)?.initialTab
    if (initialTab) setActiveTab(initialTab)
  }
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const activeIssueId = searchParams.get('issueId')

  const currentUser = useAuthStore((state) => state.user)
  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

  // Dùng chung cache với các tab Summary/List/Board/Backlog (cùng queryKey) -> không
  // tốn thêm request, chỉ để tra ra issue đầy đủ cho panel chi tiết theo key đã chọn.
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(project?._id)
  const selectedIssue = issues?.find((issue) => issue.key === selectedIssueKey) ?? null

  // Ghi nhận lượt truy cập -> phục vụ mục "Dự án gần đây" ở trang danh sách project.
  useEffect(() => {
    if (currentUser && project) {
      recordProjectVisit(currentUser._id, project._id)
    }
  }, [currentUser, project])

  // Tự động mở modal chi tiết task khi truy cập từ thông báo (Deep-link)
  useEffect(() => {
    if (activeIssueId && issues) {
      const matchedIssue = issues.find((issue) => issue._id === activeIssueId)
      if (matchedIssue) {
        setSelectedIssueKey(matchedIssue.key)
        // Xóa query param để không bị mở lại khi đóng panel
        searchParams.delete('issueId')
        setSearchParams(searchParams, { replace: true })
      }
    }
  }, [activeIssueId, issues, searchParams, setSearchParams])

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
      <header className="shrink-0 border-b border-hairline bg-surface px-6 md:px-8 pt-3">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-muted hover:text-ink transition-colors w-fit mb-2"
        >
          <ArrowLeft size={12} />
          <span>Dự án của tôi</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pastel-blue flex items-center justify-center text-pastel-blue-ink font-extrabold text-xs shrink-0">
              {(project.key || project.name).slice(0, 2).toUpperCase()}
            </div>
            <h1 className="text-lg md:text-xl font-bold text-ink tracking-tight truncate">{project.name}</h1>
            <ProjectMethodologyBadge methodology={project.methodology} />

            {/* Avatar Stack Thành viên */}
            {project.members && project.members.length > 0 && (
              <div 
                onClick={() => setIsMembersModalOpen(true)}
                className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity ml-1.5 shrink-0"
                title="Xem danh sách thành viên"
              >
                {project.members
                  .filter((m) => m.status !== 'REMOVED')
                  .sort((a, b) => (a.role === 'OWNER' ? -1 : b.role === 'OWNER' ? 1 : 0))
                  .slice(0, 4)
                  .map((member) => (
                    <Avatar
                      key={member.userId}
                      src={member.user?.avatarUrl}
                      name={member.user?.fullName || 'Thành viên'}
                      size={24}
                      className="border-2 border-surface ring-1 ring-hairline"
                    />
                  ))}
                {project.members.filter((m) => m.status !== 'REMOVED').length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-canvas border-2 border-surface flex items-center justify-center text-[9px] font-bold text-muted ring-1 ring-hairline shrink-0">
                    +{project.members.filter((m) => m.status !== 'REMOVED').length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* AI Lab (Beta) chỉ dành cho OWNER — khớp authorizeProjectRole('OWNER') chặn mọi
                route /ai ở backend, cùng điều kiện gate với nút "Thêm thành viên" bên dưới. */}
            {isOwner && (
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface text-ink border border-hairline rounded-lg text-xs font-semibold hover:border-ink/20 transition-colors active:scale-[0.98]"
              >
                <Sparkles size={14} className="text-muted" />
                <span>Sinh Epic bằng AI</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface text-ink border border-hairline rounded-lg text-xs font-semibold hover:border-ink/20 transition-colors active:scale-[0.98]"
              >
                <UserPlus size={14} className="text-muted" />
                <span>Thêm thành viên</span>
              </button>
            )}
            <button
              onClick={() => setIsCreateIssueOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-ink text-canvas rounded-lg text-xs font-semibold hover:bg-[#e4e4e5] transition-colors active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Thêm issue</span>
            </button>
          </div>
        </div>

        <WorkspaceTabs items={getTabItems(project.methodology)} value={activeTab} onChange={setActiveTab} />
      </header>

      {/* Body — vùng cuộn DUY NHẤT của trang, header phía trên luôn đứng yên.
          [scrollbar-gutter:stable]: luôn dành sẵn chỗ cho thanh cuộn dọc dù nội dung tab hiện
          tại chưa đủ dài để cuộn (vd Danh sách) — chỉ đặt `scrollbar-gutter: stable` trên
          `html` (index.css) là không đủ vì div này tự cuộn riêng (overflow-y-auto), không phải
          document cuộn. Thiếu dòng này: đổi qua lại giữa tab thấp (Danh sách) và tab cao hơn
          (Board/Backlog/Tóm tắt) làm thanh cuộn ẩn/hiện liên tục -> nội dung bị đẩy ngang mỗi
          lần đổi tab, giao diện "vỡ". */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin [scrollbar-gutter:stable]">
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

      <ProjectInviteModal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={project._id}
      />

      <ProjectMembersModal
        open={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={project.members}
      />

      <AiGenerateEpicModal
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        projectId={project._id}
      />
    </div>
  )
}

export default ProjectWorkspacePage