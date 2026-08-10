import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Calendar, Clock, Layers, CheckCircle2, Trash2, Pencil, Crown } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useProject } from '../hooks/useProject'
import { useLeaveProject, useRemoveMember, useTransferOwnership } from '../hooks/useProjectMutations'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/features/auth/authStore'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import type { ProjectMember } from '../project.types'
import ProjectEditModal from './ProjectEditModal'


interface ProjectSummaryTabProps {
  projectId: string
}


/** Vỏ card dùng chung cho toàn bộ tab — phẳng, viền mảnh, không shadow, tự stagger fade-up. */
const SummaryCard = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <motion.div variants={fadeUpItem} className={`bg-surface border border-hairline rounded-lg p-5 ${className}`}>
    {children}
  </motion.div>
)

const ProjectSummaryTab = ({ projectId }: ProjectSummaryTabProps) => {
  const { data: project, isLoading: isProjectLoading } = useProject(projectId)
  const { data: issues, isLoading: isIssuesLoading } = useProjectIssues(projectId)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const leaveMutation = useLeaveProject()
  const currentUser = useAuthStore((state) => state.user)

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

  const handleLeaveConfirm = () => {
    leaveMutation.mutate(projectId, {
      onSuccess: () => {
        setIsLeaveConfirmOpen(false)
      },
    })
  }

  const [deletingMember, setDeletingMember] = useState<ProjectMember | null>(null)
  const [transferringMember, setTransferringMember] = useState<ProjectMember | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const removeMemberMutation = useRemoveMember()
  const transferMutation = useTransferOwnership()

  const handleConfirmRemoveMember = () => {
    if (!deletingMember) return
    removeMemberMutation.mutate(
      { projectId, userId: deletingMember.userId },
      {
        onSuccess: () => {
          setDeletingMember(null)
        },
      }
    )
  }

  const handleConfirmTransfer = () => {
    if (!transferringMember) return
    transferMutation.mutate(
      { projectId, newOwnerId: transferringMember.userId },
      {
        onSuccess: () => {
          setTransferringMember(null)
        },
      }
    )
  }

  if (isProjectLoading || isIssuesLoading) {
    return (
      <div className="py-24 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  if (!project || !issues) {
    return (
      <div className="py-24 text-center text-muted text-sm font-semibold">
        Không tải được thông tin tóm tắt dự án.
      </div>
    )
  }

  // --- 0. Lọc & sắp xếp thành viên dự án ---
  const activeAndPendingMembers = project.members.filter((m) => m.status !== 'REMOVED')
  const sortedMembers = [...activeAndPendingMembers].sort((a, b) => {
    if (a.role === 'OWNER') return -1
    if (b.role === 'OWNER') return 1

    if (a.status === 'ACTIVE' && b.status === 'PENDING') return -1
    if (a.status === 'PENDING' && b.status === 'ACTIVE') return 1

    return 0
  })

  // --- 1. Thống kê trạng thái công việc chung ---
  const totalIssues = issues.length
  const stats = {
    total: totalIssues,
    todo: issues.filter((i) => i.status === 'TODO').length,
    inProgress: issues.filter((i) => i.status === 'IN_PROGRESS').length,
    inReview: issues.filter((i) => i.status === 'IN_REVIEW').length,
    done: issues.filter((i) => i.status === 'DONE').length,
  }
  const pct = (n: number) => totalIssues ? Math.round((n / totalIssues) * 100) : 0

  // --- 2. Tính toán hạn chót & tiến trình thời gian ---
  let remainingDaysText = 'Không giới hạn thời gian'
  let isOverdue = false
  let timePercent = 0

  if (project.deadline) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(project.deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      isOverdue = true
      remainingDaysText = `Đã quá hạn ${Math.abs(diffDays)} ngày`
    } else if (diffDays === 0) {
      remainingDaysText = 'Hạn chót là hôm nay'
    } else {
      remainingDaysText = `Còn lại ${diffDays} ngày`
    }

    const createdTime = new Date(project.createdAt).getTime()
    const totalDuration = deadlineDate.getTime() - createdTime
    if (totalDuration > 0) {
      const elapsed = today.getTime() - createdTime
      timePercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
    }
  }

  // Helper chuyển đổi assigneeId (string hoặc IssueMember object) về string ID duy nhất
  const getAssigneeIdStr = (assigneeId: any): string | null => {
    if (!assigneeId) return null
    if (typeof assigneeId === 'object' && assigneeId !== null && '_id' in assigneeId) {
      return assigneeId._id
    }
    return typeof assigneeId === 'string' ? assigneeId : null
  }

  // --- 3. Trích xuất danh sách thành viên thực tế từ danh sách issues ---
  const assigneesMap = new Map<string, { _id: string; fullName: string; avatarUrl: string | null }>()
  issues.forEach((issue) => {
    if (issue.assignee) {
      assigneesMap.set(issue.assignee._id, issue.assignee)
    }
  })
  const uniqueAssignees = Array.from(assigneesMap.values())

  // --- 4. Tính toán phân tải công việc (Workload) từ các issue chưa hoàn thành ---
  const activeIssues = issues.filter((i) => i.status !== 'DONE')
  const totalActiveCount = activeIssues.length

  const workloadCounts: Record<string, number> = {}
  activeIssues.forEach((issue) => {
    const assigneeIdStr = getAssigneeIdStr(issue.assigneeId)
    const key = assigneeIdStr || 'unassigned'
    workloadCounts[key] = (workloadCounts[key] || 0) + 1
  })

  const calculatedWorkloads = []

  // 1. Nhóm chưa phân công
  const unassignedCount = workloadCounts['unassigned'] || 0
  if (unassignedCount > 0 || totalActiveCount === 0) {
    calculatedWorkloads.push({
      name: 'Chưa phân công',
      avatarUrl: null,
      count: unassignedCount,
      percent: totalActiveCount ? Math.round((unassignedCount / totalActiveCount) * 100) : 0,
    })
  }

  // 2. Nhóm đã phân công cho thành viên
  uniqueAssignees.forEach((user) => {
    const userCount = workloadCounts[user._id] || 0
    if (userCount > 0) {
      calculatedWorkloads.push({
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        count: userCount,
        percent: totalActiveCount ? Math.round((userCount / totalActiveCount) * 100) : 0,
      })
    }
  })
  calculatedWorkloads.sort((a, b) => b.percent - a.percent)

  // --- 5. Tính toán mức đóng góp của thành viên (DONE tasks) ---
  const doneIssues = issues.filter((i) => i.status === 'DONE')
  const totalDoneCount = doneIssues.length

  const contributionCounts: Record<string, { done: number; total: number }> = {}

  uniqueAssignees.forEach((user) => {
    contributionCounts[user._id] = { done: 0, total: 0 }
  })

  issues.forEach((issue) => {
    const assigneeIdStr = getAssigneeIdStr(issue.assigneeId)
    if (assigneeIdStr) {
      if (!contributionCounts[assigneeIdStr]) {
        contributionCounts[assigneeIdStr] = { done: 0, total: 0 }
      }
      contributionCounts[assigneeIdStr].total += 1
      if (issue.status === 'DONE') {
        contributionCounts[assigneeIdStr].done += 1
      }
    }
  })

  const calculatedContributions = uniqueAssignees
    .map((user) => {
      const stats = contributionCounts[user._id] || { done: 0, total: 0 }
      return {
        _id: user._id,
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        done: stats.done,
        total: stats.total,
        percent: totalDoneCount ? Math.round((stats.done / totalDoneCount) * 100) : 0,
      }
    })
    .sort((a, b) => b.done - a.done)

  // --- 6. Thống kê loại công việc (Không hiển thị BUG) ---
  const typesCount = {
    epic: issues.filter((i) => i.type === 'EPIC').length,
    task: issues.filter((i) => i.type === 'TASK').length,
    subtask: issues.filter((i) => i.type === 'SUBTASK').length,
  }
  const totalTypes = typesCount.epic + typesCount.task + typesCount.subtask || 1
  const typePct = (val: number) => Math.round((val / totalTypes) * 100)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      {/* Hàng 1: Trạng thái, Hạn chót & Tiến độ, Cơ cấu công việc */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1: Trạng thái công việc */}
        <SummaryCard className="flex flex-col justify-between min-h-[300px]">
          <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-pastel-green-ink" />
            <span>Trạng thái công việc</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-grow">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#eaeaea" strokeWidth="3" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#cbc3d7" strokeDasharray={`${pct(stats.todo)}, 100`} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#956400" strokeDasharray={`${pct(stats.inReview)}, 100`} strokeDashoffset={-pct(stats.todo)} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#1f6c9f" strokeDasharray={`${pct(stats.inProgress)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview))} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#346538" strokeDasharray={`${pct(stats.done)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview) + pct(stats.inProgress))} strokeWidth="3.2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-semibold text-ink leading-none">{stats.total}</span>
                <span className="text-[9px] font-semibold text-muted uppercase tracking-wider mt-1">Tổng cộng</span>
              </div>
            </div>

            <div className="flex-grow w-full space-y-2">
              {[
                { label: 'Cần thực hiện', value: stats.todo, color: 'bg-line' },
                { label: 'Đang đánh giá', value: stats.inReview, color: 'bg-pastel-yellow-ink' },
                { label: 'Đang làm', value: stats.inProgress, color: 'bg-pastel-blue-ink' },
                { label: 'Đã xong', value: stats.done, color: 'bg-pastel-green-ink' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                    <span className="text-muted">{row.label}</span>
                  </div>
                  <span className="text-ink font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SummaryCard>

        {/* Card 2: Hạn chót & Tiến độ */}
        <SummaryCard className="flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <Clock size={18} className="text-pastel-yellow-ink" />
              <span>Hạn chót & Tiến độ</span>
            </h3>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-muted hover:text-ink rounded-md hover:bg-canvas transition-colors"
                title="Sửa thông tin dự án"
              >
                <Pencil size={15} />
              </button>
            )}
          </div>

          <div className="flex-grow flex flex-col justify-center space-y-5">
            <div className="space-y-1">
              <span className="text-xs text-muted font-semibold block uppercase tracking-wider">Hạn kết thúc</span>
              <div className="flex items-center gap-2 text-ink">
                <Calendar size={15} className="text-muted" />
                <span className="text-sm font-semibold">{formatDate(project.deadline)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">Trạng thái thời gian</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isOverdue ? 'bg-pastel-red text-pastel-red-ink' : 'bg-pastel-green text-pastel-green-ink'}`}>
                  {remainingDaysText}
                </span>
              </div>

              {project.deadline && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOverdue ? 'bg-pastel-red-ink' : 'bg-pastel-yellow-ink'}`}
                      style={{ width: `${timePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted font-medium">
                    <span>Ngày tạo: {formatDate(project.createdAt)}</span>
                    <span>Đã qua {timePercent}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Rời dự án */}
            <button
              onClick={() => setIsLeaveConfirmOpen(true)}
              className="mt-3 w-full py-2 bg-pastel-red text-pastel-red-ink rounded-lg text-xs font-semibold hover:bg-pastel-red/70 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] shrink-0"
            >
              Rời dự án
            </button>
          </div>
        </SummaryCard>

        {/* Card 3: Cơ cấu công việc */}
        <SummaryCard className="flex flex-col justify-between min-h-[300px]">
          <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <Layers size={18} className="text-pastel-blue-ink" />
            <span>Cơ cấu công việc</span>
          </h3>

          <div className="flex-grow flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-muted font-semibold block uppercase tracking-wider">Tỷ lệ các loại task</span>
              <div className="w-full h-3 bg-canvas rounded-full overflow-hidden flex mt-2">
                {typesCount.epic > 0 && <div className="h-full bg-brand transition-all" style={{ width: `${typePct(typesCount.epic)}%` }} title={`Epic: ${typesCount.epic}`} />}
                {typesCount.task > 0 && <div className="h-full bg-pastel-blue-ink transition-all" style={{ width: `${typePct(typesCount.task)}%` }} title={`Task: ${typesCount.task}`} />}
                {typesCount.subtask > 0 && <div className="h-full bg-pastel-green-ink transition-all" style={{ width: `${typePct(typesCount.subtask)}%` }} title={`Subtask: ${typesCount.subtask}`} />}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2.5 bg-canvas border border-hairline rounded-lg">
                <span className="text-[10px] text-muted font-semibold block uppercase">Epic</span>
                <span className="text-lg font-semibold text-brand block mt-0.5">{typesCount.epic}</span>
              </div>
              <div className="p-2.5 bg-canvas border border-hairline rounded-lg">
                <span className="text-[10px] text-muted font-semibold block uppercase">Task</span>
                <span className="text-lg font-semibold text-pastel-blue-ink block mt-0.5">{typesCount.task}</span>
              </div>
              <div className="p-2.5 bg-canvas border border-hairline rounded-lg">
                <span className="text-[10px] text-muted font-semibold block uppercase">Subtask</span>
                <span className="text-lg font-semibold text-pastel-green-ink block mt-0.5">{typesCount.subtask}</span>
              </div>
            </div>
          </div>
        </SummaryCard>

      </div>

      {/* Hàng 2: Hoạt động gần đây & Phân tải công việc */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Thành viên dự án */}
        <SummaryCard className="flex flex-col h-[320px]">
          <h3 className="text-base font-semibold text-ink mb-4">Thành viên dự án</h3>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {sortedMembers.map((member) => {
              const displayName = member.user?.fullName || 'Thành viên hệ thống'
              const avatarUrl = member.user?.avatarUrl
              const isOwnerRole = member.role === 'OWNER'
              const isPending = member.status === 'PENDING'
              const isActive = member.status === 'ACTIVE'

              return (
                <motion.div
                  key={member.userId}
                  variants={fadeUpItem}
                  className="flex items-center justify-between p-3 hover:bg-canvas rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={avatarUrl} name={displayName} size={32} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink">{displayName}</span>
                        {isOwnerRole && (
                          <span className="text-[9px] font-bold bg-pastel-blue text-pastel-blue-ink px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Owner
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[9px] font-semibold bg-pastel-yellow text-pastel-yellow-ink px-1.5 py-0.5 rounded-full">
                            Chờ xác nhận
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted mt-0.5">
                        Tham gia ngày: {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {isOwner && !isOwnerRole && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => setTransferringMember(member)}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded text-[11px] font-bold transition-colors"
                          title="Chuyển quyền Chủ sở hữu dự án cho thành viên này"
                        >
                          <Crown size={12} />
                          <span>Chuyển Owner</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingMember(member)}
                        className="p-1.5 text-muted hover:text-pastel-red-ink rounded-md hover:bg-pastel-red transition-colors shrink-0"
                        title="Gỡ thành viên khỏi dự án"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </SummaryCard>

        {/* Phân tải công việc */}
        <SummaryCard className="flex flex-col h-[320px]">
          <h3 className="text-base font-semibold text-ink mb-4">Phân tải công việc</h3>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {calculatedWorkloads.map((item) => (
              <motion.div key={item.name} variants={fadeUpItem} className="flex items-center gap-4">
                <Avatar src={item.avatarUrl} name={item.name} size={28} />
                <div className="flex-grow space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-ink">
                    <span>{item.name}</span>
                    <span className="text-muted font-medium">{item.percent}% ({item.count} task chưa xong)</span>
                  </div>
                  <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-pastel-blue-ink" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
            {calculatedWorkloads.length === 0 && (
              <p className="text-xs text-subtle italic py-8 text-center">Chưa có công việc tồn đọng.</p>
            )}
          </motion.div>
        </SummaryCard>

      </div>

      {/* Hàng 3: Mức độ đóng góp của thành viên */}
      <SummaryCard>
        <h3 className="text-base font-semibold text-ink mb-2">Đóng góp của thành viên</h3>
        <p className="text-xs text-muted mb-6">Tỷ lệ công việc đã hoàn thành (DONE) trên tổng số task được giao của từng người.</p>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          {calculatedContributions.map((member) => {
            const completionPercent = member.total ? Math.round((member.done / member.total) * 100) : 0

            return (
              <motion.div key={member._id} variants={fadeUpItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-hairline rounded-lg hover:border-ink/15 transition-colors">
                <div className="flex items-center gap-3 w-64 shrink-0">
                  <Avatar src={member.avatarUrl} name={member.name} size={32} />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">{member.name}</h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">
                      Đóng góp: <span className="font-semibold text-pastel-green-ink">{member.percent}%</span> tổng số DONE của dự án
                    </p>
                  </div>
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-muted uppercase">
                    <span>Tiến độ cá nhân</span>
                    <span className="text-ink font-medium">{completionPercent}% ({member.done}/{member.total} task)</span>
                  </div>
                  <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-pastel-green-ink" style={{ width: `${completionPercent}%` }} />
                  </div>
                </div>
              </motion.div>
            )
          })}

          {calculatedContributions.length === 0 && (
            <p className="text-xs text-subtle italic py-6 text-center">Chưa có thành viên nào hoàn thành công việc.</p>
          )}
        </motion.div>
      </SummaryCard>

      {/* Modal xác nhận rời dự án */}
      <ConfirmDialog
        open={isLeaveConfirmOpen}
        title={isOwner ? "Xóa dự án & rời đi" : "Rời khỏi dự án"}
        message={
          isOwner
            ? `Bạn đang là Trưởng nhóm (Owner) của dự án "${project.name}". Nếu bạn rời đi, toàn bộ dự án cùng với tất cả công việc (tasks) và phân đoạn (sprints) liên quan sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?`
            : `Bạn có chắc chắn muốn rời khỏi dự án "${project.name}"? Sau khi rời đi, tất cả các công việc đang được gán cho bạn sẽ được chuyển về trạng thái 'Chưa phân công'.`
        }
        confirmText={isOwner ? "Xóa & Rời đi" : "Rời dự án"}
        danger
        loading={leaveMutation.isPending}
        onConfirm={handleLeaveConfirm}
        onClose={() => setIsLeaveConfirmOpen(false)}
      />

      {/* Modal xác nhận xóa thành viên */}
      <ConfirmDialog
        open={deletingMember !== null}
        title="Gỡ thành viên khỏi dự án"
        message={`Bạn có chắc chắn muốn gỡ thành viên "${deletingMember?.user?.fullName || 'Thành viên này'}" ra khỏi dự án? Thành viên sẽ mất toàn bộ quyền truy cập và các công việc họ đang phụ trách sẽ tự động trở thành "Cần giao lại".`}
        confirmText="Gỡ khỏi dự án"
        danger
        loading={removeMemberMutation.isPending}
        onConfirm={handleConfirmRemoveMember}
        onClose={() => setDeletingMember(null)}
      />

      {/* Modal xác nhận chuyển quyền Chủ sở hữu dự án */}
      <ConfirmDialog
        open={transferringMember !== null}
        title="Chuyển quyền Chủ sở hữu dự án"
        message={`Bạn có chắc chắn muốn chuyển quyền Chủ sở hữu dự án (OWNER) cho "${transferringMember?.user?.fullName || 'thành viên này'}"? Sau khi chuyển, bạn sẽ trở thành Thành viên (MEMBER) và nhường lại quyền quản trị dự án.`}
        confirmText="Xác nhận chuyển OWNER"
        loading={transferMutation.isPending}
        onConfirm={handleConfirmTransfer}
        onClose={() => setTransferringMember(null)}
      />

      {/* Modal chỉnh sửa thông tin dự án */}
      <ProjectEditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />
    </motion.div>
  )
}

export default ProjectSummaryTab
