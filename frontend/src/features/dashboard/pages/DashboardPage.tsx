import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Activity, ListChecks, Layers, Timer, Users } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useMyTasks } from '@/features/tasks/hooks/useMyTasks'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { formatDayMonth, daysUntil } from '@/lib/format'
import { getProjectColor } from '@/lib/projectColor'
import type { IssuePriority } from '@/features/issues/issue.types'
import { useUpcomingSprints } from '../hooks/useDashboard'

const PRIORITY_RANK: Record<IssuePriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const sprintDueLabel = (endDate: string) => {
  const days = daysUntil(endDate)
  if (days === null) return ''
  if (days > 0) return `Còn ${days} ngày`
  if (days === 0) return 'Hết hạn hôm nay'
  return `Quá hạn ${Math.abs(days)} ngày`
}

/** Tiêu đề panel dạng nhãn nhỏ gọn (uppercase, chữ phụ) thay vì heading to — dùng chung cho
 * cả 3 panel để giữ nhịp thị giác nhất quán và tiết kiệm chiều cao. */
const PanelHead = ({ title, onViewAll }: { title: string; onViewAll?: () => void }) => (
  <div className="flex items-center justify-between mb-3.5">
    <h3 className="text-[11px] font-bold text-muted uppercase tracking-wide">{title}</h3>
    {onViewAll && (
      <button onClick={onViewAll} className="text-[11px] font-bold text-brand hover:underline flex items-center gap-0.5">
        <span>Xem tất cả</span>
        <ChevronRight size={12} />
      </button>
    )}
  </div>
)

const EmptyRow = ({ children }: { children: ReactNode }) => (
  <div className="border border-dashed border-line/35 rounded-xl py-5 text-center text-subtle text-[11px] font-medium">
    {children}
  </div>
)

const DashboardPage = () => {
  const navigate = useNavigate()
  const { data: tasks, isLoading: isTasksLoading } = useMyTasks()
  const { data: projects, isLoading: isProjectsLoading } = useProjects()
  const { data: upcomingSprints, isLoading: isSprintsLoading } = useUpcomingSprints()

  if (isTasksLoading || !tasks) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const todoCount = tasks.filter((task) => task.status === 'TODO').length
  const inProgressCount = tasks.filter((task) => task.status === 'IN_PROGRESS').length

  const priorityTasks = tasks
    .filter((task) => task.status !== 'DONE')
    .slice()
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 5)

  const topProjects = (projects ?? []).slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 p-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-muted text-sm font-medium">
          Hôm nay bạn có <span className="text-brand font-bold">{todoCount + inProgressCount} công việc</span> cần tập trung.
        </p>

        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white rounded-lg text-xs font-bold shadow-sm shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 self-end sm:self-auto"
        >
          <Plus size={14} />
          <span>Tạo dự án mới</span>
        </button>
      </header>

      <section className="flex flex-wrap gap-2 p-1.5 bg-slate-50/70 border border-line/15 rounded-xl">
        <div className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-white border border-line/20 rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/8 flex items-center justify-center text-brand shrink-0">
            <ListChecks size={13} />
          </div>
          <div>
            <div className="text-base font-extrabold text-ink leading-none">{todoCount}</div>
            <div className="text-[9px] font-bold text-subtle uppercase tracking-wide mt-0.5">Cần thực hiện</div>
          </div>
        </div>

        <div className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-white border border-line/20 rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Activity size={13} />
          </div>
          <div>
            <div className="text-base font-extrabold text-ink leading-none">{inProgressCount}</div>
            <div className="text-[9px] font-bold text-subtle uppercase tracking-wide mt-0.5">Đang tiến hành</div>
          </div>
        </div>

        <div className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-white border border-line/20 rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers size={13} />
          </div>
          <div>
            <div className="text-base font-extrabold text-ink leading-none">{isProjectsLoading ? '—' : (projects?.length ?? 0)}</div>
            <div className="text-[9px] font-bold text-subtle uppercase tracking-wide mt-0.5">Dự án tham gia</div>
          </div>
        </div>

        <div className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-white border border-line/20 rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Timer size={13} />
          </div>
          <div>
            <div className="text-base font-extrabold text-ink leading-none">{isSprintsLoading ? '—' : (upcomingSprints?.length ?? 0)}</div>
            <div className="text-[9px] font-bold text-subtle uppercase tracking-wide mt-0.5">Sprint đang chạy</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 bg-white border border-line/20 rounded-2xl p-5 shadow-sm">
          <PanelHead title="Việc ưu tiên" onViewAll={() => navigate('/tasks')} />

          <div className="space-y-2">
            {priorityTasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-line/10 rounded-xl transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: getProjectColor(task.projectId) }}
                  />
                  <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center text-brand shrink-0">
                    <IssueTypeIcon type={task.type} size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-ink leading-snug truncate">{task.title}</h4>
                    <p className="text-[10px] text-muted mt-0.5">
                      <span className="font-mono font-semibold">{task.key}</span> · {task.projectName}
                    </p>
                  </div>
                </div>

                <IssuePriorityBadge priority={task.priority} showIcon={false} />
              </div>
            ))}

            {priorityTasks.length === 0 && <EmptyRow>Không có việc nào đang chờ xử lý — bạn đã bắt kịp tiến độ!</EmptyRow>}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white border border-line/20 rounded-2xl p-5 shadow-sm flex flex-col">
            <PanelHead title="Sprint sắp kết thúc" />
            <div className="space-y-2">
              {isSprintsLoading && (
                <div className="py-4 flex justify-center text-muted">
                  <Spinner />
                </div>
              )}

              {!isSprintsLoading &&
                upcomingSprints?.slice(0, 2).map((sprint) => {
                  const { day, month } = formatDayMonth(sprint.endDate)
                  return (
                    <button
                      key={sprint._id}
                      onClick={() => navigate(`/projects/${sprint.projectId}`, { state: { initialTab: 'BOARD' } })}
                      className="w-full flex items-center gap-2.5 p-2.5 border border-line/15 rounded-xl bg-white hover:bg-slate-50 hover:border-brand/20 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand/5 flex flex-col items-center justify-center border border-brand/10 text-brand shrink-0">
                        <span className="text-xs font-extrabold leading-none">{day}</span>
                        <span className="text-[7px] font-bold tracking-wider mt-0.5">{month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-ink truncate">{sprint.name}</h4>
                        <p className="text-[10px] text-muted font-medium mt-0.5 truncate">
                          {sprint.projectName} · <span className="text-brand font-bold">{sprintDueLabel(sprint.endDate)}</span>
                        </p>
                      </div>
                      <ChevronRight size={13} className="text-subtle shrink-0" />
                    </button>
                  )
                })}

              {!isSprintsLoading && (upcomingSprints?.length ?? 0) === 0 && <EmptyRow>Không có sprint nào đang chạy.</EmptyRow>}
            </div>
          </div>

          <div className="bg-white border border-line/20 rounded-2xl p-5 shadow-sm flex flex-col">
            <PanelHead title="Dự án của bạn" onViewAll={() => navigate('/projects')} />
            <div className="space-y-2">
              {isProjectsLoading && (
                <div className="py-4 flex justify-center text-muted">
                  <Spinner />
                </div>
              )}

              {!isProjectsLoading &&
                topProjects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="w-full flex items-center gap-2.5 p-2.5 border border-line/10 rounded-xl hover:bg-slate-50 hover:border-line/30 transition-all text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                      style={{ backgroundColor: getProjectColor(project._id) }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-ink truncate">{project.name}</h4>
                      <p className="text-[10px] text-subtle font-semibold mt-0.5 flex items-center gap-1">
                        <Users size={10} />
                        {project.members.length} thành viên
                      </p>
                    </div>
                    <span className="text-[8px] font-bold text-muted uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {project.methodology}
                    </span>
                  </button>
                ))}

              {!isProjectsLoading && topProjects.length === 0 && <EmptyRow>Bạn chưa tham gia dự án nào.</EmptyRow>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
