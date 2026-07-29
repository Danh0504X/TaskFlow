import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import Avatar from '@/components/ui/Avatar'
import SearchInput from '@/components/ui/SearchInput'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import IssueDetailPanel from '@/features/issues/components/IssueDetailPanel'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getProjectColor } from '@/lib/projectColor'
import { staggerContainer, fadeUpItem, easeOut } from '@/lib/motion'
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
  // Nhóm dự án đang thu gọn (mặc định tất cả mở) — Set thay vì Record vì chỉ cần biết có/không.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const isGroupOpen = (projectId: string) => !collapsedGroups.has(projectId)
  const toggleGroup = (projectId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

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

  // Key của khối nội dung đang hiển thị — đổi giữa loading/empty/2 chế độ nhóm sẽ crossfade
  // mượt qua AnimatePresence thay vì DOM bị thay thế đột ngột.
  const viewKey = isLoading ? 'loading' : filteredTasks.length === 0 ? 'empty' : groupMode

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      <PageHeader
        title="Việc của tôi"
        subtitle={`${tasks?.length ?? 0} việc được giao, trải trên ${projectCount} dự án — theo dõi và cập nhật trạng thái ngay tại đây.`}
        actions={<Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size={36} />}
      />

      <div className="flex flex-col gap-8 px-8 md:px-12 pt-6 pb-12">
        <section className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-surface border border-hairline rounded-lg">
          <SearchInput
            containerClassName="max-w-sm flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã hoặc tên công việc..."
          />

          <Tabs items={groupModeItems} value={groupMode} onChange={setGroupMode} />
        </section>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: easeOut }}
          >
            {isLoading && (
              <div className="py-12 flex justify-center text-muted">
                <Spinner />
              </div>
            )}

            {!isLoading && filteredTasks.length === 0 && (
              <div className="border border-dashed border-hairline rounded-lg py-12 text-center text-subtle text-xs font-medium">
                Không tìm thấy công việc nào khớp với điều kiện tìm kiếm.
              </div>
            )}

            {!isLoading && filteredTasks.length > 0 && groupMode === 'PROJECT' && (
              <motion.section variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3.5">
                {projectGroups.map((group) => {
                  const open = isGroupOpen(group.projectId)
                  return (
                    <motion.div
                      key={group.projectId}
                      variants={fadeUpItem}
                      className="bg-surface border border-hairline rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.projectId)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 bg-canvas hover:bg-hairline/40 transition-colors text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(group.projectId) }} />
                        <span className="font-semibold text-sm text-ink">{group.projectName}</span>
                        <span className="text-[10px] font-semibold text-subtle bg-surface border border-hairline rounded-full px-2 py-0.5">
                          {group.tasks.length} việc
                        </span>
                        <motion.span
                          animate={{ rotate: open ? 90 : 0 }}
                          transition={{ duration: 0.2, ease: easeOut }}
                          className="ml-auto text-subtle"
                        >
                          <ChevronRight size={15} />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: easeOut }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="divide-y divide-hairline">
                              {group.tasks.map((task) => (
                                <div
                                  key={task._id}
                                  onClick={() => setSelectedTaskKey(task.key)}
                                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 hover:bg-canvas cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-pastel-blue text-pastel-blue-ink flex items-center justify-center shrink-0">
                                      <IssueTypeIcon type={task.type} size={15} />
                                    </div>
                                    <span className="text-xs font-semibold text-brand font-mono shrink-0">{task.key}</span>
                                    <h4 className="text-xs font-semibold text-ink truncate">{task.title}</h4>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <IssuePriorityBadge priority={task.priority} showIcon={false} />
                                    <IssueStatusBadge status={task.status} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.section>
            )}

            {!isLoading && filteredTasks.length > 0 && groupMode === 'STATUS' && (
              <motion.section
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
              >
                {statusGroups.map(({ status, tasks: columnTasks }) => (
                  <motion.div key={status} variants={fadeUpItem} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs font-semibold text-muted">{STATUS_LABELS[status]}</span>
                      <span className="text-[10px] font-semibold text-subtle ml-auto">{columnTasks.length}</span>
                    </div>

                    {columnTasks.map((task) => (
                      <motion.div
                        key={task._id}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedTaskKey(task.key)}
                        className="flex flex-col gap-2 p-3.5 bg-surface border border-hairline rounded-lg hover:border-ink/15 cursor-pointer transition-colors"
                      >
                        <h4 className="text-xs font-semibold text-ink leading-snug line-clamp-2">{task.title}</h4>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-subtle font-mono">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(task.projectId) }} />
                            {task.key}
                          </span>
                          <IssuePriorityBadge priority={task.priority} showIcon={false} />
                        </div>
                      </motion.div>
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="border border-dashed border-hairline rounded-lg py-6 text-center text-subtle text-[10px] font-medium">
                        Không có việc nào
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
