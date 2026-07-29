import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ChevronRight, Search } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import Avatar from '@/components/ui/Avatar'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import IssueDetailPanel from '@/features/issues/components/IssueDetailPanel'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getProjectColor } from '@/lib/projectColor'
import { useMyTasks } from '../hooks/useMyTasks'
import type { Issue, IssuePriority, IssueStatus } from '@/features/issues/issue.types'

type GroupMode = 'PROJECT' | 'STATUS'

const groupModeItems: { value: GroupMode; label: string }[] = [
  { value: 'PROJECT', label: 'Theo dự án' },
  { value: 'STATUS', label: 'Theo trạng thái' },
]

const STATUS_ORDER: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const STATUS_LABELS: Record<IssueStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Đang đánh giá',
  DONE: 'Hoàn thành',
}
const PRIORITY_RANK: Record<IssuePriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const byPriority = (a: Issue, b: Issue) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]

interface ProjectGroup {
  projectId: string
  projectName: string
  tasks: Issue[]
}

const MyTasksPage = () => {
  const { user } = useAuth()
  const { data: tasks, isLoading } = useMyTasks()
  const [groupMode, setGroupMode] = useState<GroupMode>('PROJECT')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return (tasks ?? []).filter(
      (task) =>
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.key.toLowerCase().includes(query),
    )
  }, [tasks, searchQuery])

  const projectGroups = useMemo<ProjectGroup[]>(() => {
    const byProject = new Map<string, ProjectGroup>()
    filteredTasks.forEach((task) => {
      const existing = byProject.get(task.projectId)
      if (existing) {
        existing.tasks.push(task)
      } else {
        byProject.set(task.projectId, {
          projectId: task.projectId,
          projectName: task.projectName ?? 'Không rõ dự án',
          tasks: [task],
        })
      }
    })
    return Array.from(byProject.values())
      .map((group) => ({ ...group, tasks: group.tasks.slice().sort(byPriority) }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName))
  }, [filteredTasks])

  const statusGroups = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      tasks: filteredTasks.filter((task) => task.status === status).sort(byPriority),
    }))
  }, [filteredTasks])

  const selectedTask = tasks?.find((task) => task.key === selectedTaskKey) ?? null
  const projectCount = new Set((tasks ?? []).map((task) => task.projectId)).size

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-brand tracking-tight mb-2">Công việc của tôi</h2>
          <p className="text-muted font-medium max-w-xl text-sm leading-relaxed">
            {tasks?.length ?? 0} việc được giao, trải trên {projectCount} dự án — theo dõi và cập nhật trạng thái ngay tại đây.
          </p>
        </div>
        <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size={40} />
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-white border border-line/15 rounded-2xl shadow-sm">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã hoặc tên công việc..."
            className="w-full bg-slate-50 border border-line/20 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
          />
        </div>

        <Tabs items={groupModeItems} value={groupMode} onChange={setGroupMode} />
      </section>

      {isLoading && (
        <div className="py-12 flex justify-center text-muted">
          <Spinner />
        </div>
      )}

      {!isLoading && filteredTasks.length === 0 && (
        <div className="border border-dashed border-line/35 rounded-3xl py-12 text-center text-subtle text-xs font-medium">
          Không tìm thấy công việc nào khớp với điều kiện tìm kiếm.
        </div>
      )}

      {!isLoading && filteredTasks.length > 0 && groupMode === 'PROJECT' && (
        <section className="flex flex-col gap-3.5">
          {projectGroups.map((group) => (
            <details key={group.projectId} className="group/detail bg-white border border-line/15 rounded-2xl shadow-sm overflow-hidden" open>
              <summary className="flex items-center gap-3 px-5 py-3.5 bg-slate-50/70 cursor-pointer select-none list-none">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(group.projectId) }} />
                <span className="font-bold text-sm text-ink">{group.projectName}</span>
                <span className="text-[10px] font-bold text-subtle bg-white border border-line/25 rounded-full px-2 py-0.5">
                  {group.tasks.length} việc
                </span>
                <ChevronRight size={15} className="ml-auto text-subtle transition-transform group-open/detail:rotate-90" />
              </summary>

              <div className="divide-y divide-line/10">
                {group.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTaskKey(task.key)}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center shrink-0">
                        <IssueTypeIcon type={task.type} size={15} />
                      </div>
                      <span className="text-xs font-bold text-brand font-mono shrink-0">{task.key}</span>
                      <h4 className="text-xs font-bold text-ink truncate">{task.title}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <IssuePriorityBadge priority={task.priority} showIcon={false} />
                      <IssueStatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
      )}

      {!isLoading && filteredTasks.length > 0 && groupMode === 'STATUS' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {statusGroups.map(({ status, tasks: columnTasks }) => (
            <div key={status} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-muted">{STATUS_LABELS[status]}</span>
                <span className="text-[10px] font-bold text-subtle ml-auto">{columnTasks.length}</span>
              </div>

              {columnTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskKey(task.key)}
                  className="flex flex-col gap-2 p-3.5 bg-white border border-line/15 rounded-xl shadow-sm hover:border-brand/30 cursor-pointer transition-all"
                >
                  <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2">{task.title}</h4>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-subtle font-mono">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(task.projectId) }} />
                      {task.key}
                    </span>
                    <IssuePriorityBadge priority={task.priority} showIcon={false} />
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="border border-dashed border-line/25 rounded-xl py-6 text-center text-subtle text-[10px] font-medium">
                  Không có việc nào
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <AnimatePresence>
        {selectedTaskKey && (
          <IssueDetailPanel
            issue={selectedTask}
            projectId={selectedTask?.projectId ?? ''}
            isLoading={isLoading}
            onClose={() => setSelectedTaskKey(null)}
            onSelectIssue={setSelectedTaskKey}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyTasksPage
