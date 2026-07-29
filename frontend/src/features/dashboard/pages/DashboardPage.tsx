import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, Plus, Activity, ListChecks, Layers, Timer, Users } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import PageHeaderButton from '@/components/layout/PageHeaderButton'
import Spinner from '@/components/ui/Spinner'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useMyTasks } from '@/features/tasks/hooks/useMyTasks'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { formatDayMonth, daysUntil } from '@/lib/format'
import { getProjectColor } from '@/lib/projectColor'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
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
    <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide">{title}</h3>
    {onViewAll && (
      <button onClick={onViewAll} className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-0.5">
        <span>Xem tất cả</span>
        <ChevronRight size={12} />
      </button>
    )}
  </div>
)

const EmptyRow = ({ children }: { children: ReactNode }) => (
  <div className="border border-dashed border-hairline rounded-lg py-5 text-center text-subtle text-[11px] font-medium">
    {children}
  </div>
)

interface StatCardProps {
  icon: typeof ListChecks
  value: ReactNode
  label: string
  tint: string
  ink: string
}

/** 1 ô thống kê trong dải "bento" đầu trang — mỗi chỉ số 1 màu pastel riêng để phân biệt nhanh. */
const StatCard = ({ icon: Icon, value, label, tint, ink }: StatCardProps) => (
  <motion.div
    variants={fadeUpItem}
    className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-surface border border-hairline rounded-lg px-3.5 py-3"
  >
    <div className={`w-8 h-8 rounded-lg ${tint} ${ink} flex items-center justify-center shrink-0`}>
      <Icon size={14} />
    </div>
    <div>
      <div className="text-base font-semibold text-ink leading-none">{value}</div>
      <div className="text-[9px] font-semibold text-subtle uppercase tracking-wide mt-1">{label}</div>
    </div>
  </motion.div>
)

const DashboardPage = () => {
  const navigate = useNavigate()
  const { data: tasks, isLoading: isTasksLoading } = useMyTasks()
  const { data: projects, isLoading: isProjectsLoading } = useProjects()
  const { data: upcomingSprints, isLoading: isSprintsLoading } = useUpcomingSprints()

  const todoCount = tasks?.filter((task) => task.status === 'TODO').length ?? 0
  const inProgressCount = tasks?.filter((task) => task.status === 'IN_PROGRESS').length ?? 0

  const priorityTasks = (tasks ?? [])
    .filter((task) => task.status !== 'DONE')
    .slice()
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 5)

  const topProjects = (projects ?? []).slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      <PageHeader
        title="Tổng quan"
        subtitle={
          <>
            Hôm nay bạn có <span className="text-brand font-semibold">{todoCount + inProgressCount} công việc</span> cần tập trung.
          </>
        }
        actions={
          <PageHeaderButton icon={Plus} variant="primary" onClick={() => navigate('/projects/new')}>
            Tạo dự án mới
          </PageHeaderButton>
        }
      />

      <div className="flex flex-col gap-5 px-8 md:px-12 pt-6 pb-12">
        {isTasksLoading || !tasks ? (
          <div className="min-h-[50vh] flex items-center justify-center text-muted">
            <Spinner />
          </div>
        ) : (
          <>
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-3"
            >
              <StatCard icon={ListChecks} value={todoCount} label="Cần thực hiện" tint="bg-pastel-blue" ink="text-pastel-blue-ink" />
              <StatCard icon={Activity} value={inProgressCount} label="Đang tiến hành" tint="bg-pastel-yellow" ink="text-pastel-yellow-ink" />
              <StatCard
                icon={Layers}
                value={isProjectsLoading ? '—' : (projects?.length ?? 0)}
                label="Dự án tham gia"
                tint="bg-pastel-green"
                ink="text-pastel-green-ink"
              />
              <StatCard
                icon={Timer}
                value={isSprintsLoading ? '—' : (upcomingSprints?.length ?? 0)}
                label="Sprint đang chạy"
                tint="bg-pastel-red"
                ink="text-pastel-red-ink"
              />
            </motion.section>

            <motion.section
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
            >
              <motion.div variants={fadeUpItem} className="lg:col-span-2 bg-surface border border-hairline rounded-lg p-5">
                <PanelHead title="Việc ưu tiên" onViewAll={() => navigate('/tasks')} />

                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
                  {priorityTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      variants={fadeUpItem}
                      className="flex items-center justify-between gap-3 p-2.5 bg-canvas border border-hairline rounded-lg hover:border-ink/15 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: getProjectColor(task.projectId) }}
                        />
                        <div className="w-8 h-8 rounded-lg bg-pastel-blue text-pastel-blue-ink flex items-center justify-center shrink-0">
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
                    </motion.div>
                  ))}

                  {priorityTasks.length === 0 && <EmptyRow>Không có việc nào đang chờ xử lý — bạn đã bắt kịp tiến độ!</EmptyRow>}
                </motion.div>
              </motion.div>

              <motion.div variants={fadeUpItem} className="flex flex-col gap-5">
                <div className="bg-surface border border-hairline rounded-lg p-5 flex flex-col">
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
                          <motion.button
                            key={sprint._id}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => navigate(`/projects/${sprint.projectId}`, { state: { initialTab: 'BOARD' } })}
                            className="w-full flex items-center gap-2.5 p-2.5 border border-hairline rounded-lg bg-surface hover:border-ink/15 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-pastel-yellow text-pastel-yellow-ink flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-semibold leading-none">{day}</span>
                              <span className="text-[7px] font-semibold tracking-wider mt-0.5">{month}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-xs text-ink truncate">{sprint.name}</h4>
                              <p className="text-[10px] text-muted font-medium mt-0.5 truncate">
                                {sprint.projectName} · <span className="text-brand font-semibold">{sprintDueLabel(sprint.endDate)}</span>
                              </p>
                            </div>
                            <ChevronRight size={13} className="text-subtle shrink-0" />
                          </motion.button>
                        )
                      })}

                    {!isSprintsLoading && (upcomingSprints?.length ?? 0) === 0 && <EmptyRow>Không có sprint nào đang chạy.</EmptyRow>}
                  </div>
                </div>

                <div className="bg-surface border border-hairline rounded-lg p-5 flex flex-col">
                  <PanelHead title="Dự án của bạn" onViewAll={() => navigate('/projects')} />
                  <div className="space-y-2">
                    {isProjectsLoading && (
                      <div className="py-4 flex justify-center text-muted">
                        <Spinner />
                      </div>
                    )}

                    {!isProjectsLoading &&
                      topProjects.map((project) => (
                        <motion.button
                          key={project._id}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="w-full flex items-center gap-2.5 p-2.5 border border-hairline rounded-lg hover:border-ink/15 transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs shrink-0"
                            style={{ backgroundColor: getProjectColor(project._id) }}
                          >
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs text-ink truncate">{project.name}</h4>
                            <p className="text-[10px] text-subtle font-semibold mt-0.5 flex items-center gap-1">
                              <Users size={10} />
                              {project.members.length} thành viên
                            </p>
                          </div>
                          <span className="text-[8px] font-semibold text-muted uppercase tracking-wide bg-canvas border border-hairline px-1.5 py-0.5 rounded shrink-0">
                            {project.methodology}
                          </span>
                        </motion.button>
                      ))}

                    {!isProjectsLoading && topProjects.length === 0 && <EmptyRow>Bạn chưa tham gia dự án nào.</EmptyRow>}
                  </div>
                </div>
              </motion.div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
