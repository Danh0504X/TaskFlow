import { useState } from 'react'
import { ArrowRight, Calendar, Clock, Layers, CheckCircle2 } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useProject } from '../hooks/useProject'
import { useLeaveProject } from '../hooks/useProjectMutations'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/features/auth/authStore'

interface ProjectSummaryTabProps {
  projectId: string
}

// Hoạt động gần đây CHƯA có backend (activity log) -> giữ mock tĩnh theo yêu cầu.
const activities = [
  {
    id: 'a1',
    user: { name: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
    action: "đã chuyển trạng thái",
    issueKey: 'NEB-04',
    newValue: 'DONE',
  },
  {
    id: 'a2',
    user: { name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' },
    action: 'đã bình luận về',
    issueKey: 'NEB-03',
    comment: 'Đã hoàn thành kiểm thử cục bộ, phản hồi trả về chính xác.',
  },
]

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
    const key = issue.assigneeId || 'unassigned'
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
    if (issue.assigneeId) {
      if (!contributionCounts[issue.assigneeId]) {
        contributionCounts[issue.assigneeId] = { done: 0, total: 0 }
      }
      contributionCounts[issue.assigneeId].total += 1
      if (issue.status === 'DONE') {
        contributionCounts[issue.assigneeId].done += 1
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
    <div className="space-y-6">
      {/* Hàng 1: Trạng thái, Hạn chót & Tiến độ, Cơ cấu công việc */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Trạng thái công việc */}
        <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-brand" />
            <span>Trạng thái công việc</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-grow">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#6b38d4" strokeDasharray={`${pct(stats.todo)}, 100`} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#8b5cf6" strokeDasharray={`${pct(stats.inReview)}, 100`} strokeDashoffset={-pct(stats.todo)} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#06b6d4" strokeDasharray={`${pct(stats.inProgress)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview))} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#10b981" strokeDasharray={`${pct(stats.done)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview) + pct(stats.inProgress))} strokeWidth="3.2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-ink leading-none">{stats.total}</span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1">Tổng cộng</span>
              </div>
            </div>

            <div className="flex-grow w-full space-y-2">
              {[
                { label: 'Cần thực hiện', value: stats.todo, color: 'bg-brand' },
                { label: 'Đang đánh giá', value: stats.inReview, color: 'bg-brand-glow' },
                { label: 'Đang làm', value: stats.inProgress, color: 'bg-cyan-500' },
                { label: 'Đã xong', value: stats.done, color: 'bg-emerald-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                    <span className="text-muted">{row.label}</span>
                  </div>
                  <span className="text-ink font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Hạn chót & Tiến độ */}
        <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            <span>Hạn chót & Tiến độ</span>
          </h3>

          <div className="flex-grow flex flex-col justify-center space-y-5">
            <div className="space-y-1">
              <span className="text-xs text-muted font-bold block uppercase tracking-wider">Hạn kết thúc</span>
              <div className="flex items-center gap-2 text-ink">
                <Calendar size={15} className="text-muted" />
                <span className="text-sm font-extrabold">{formatDate(project.deadline)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted font-bold uppercase tracking-wider">Trạng thái thời gian</span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${isOverdue ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {remainingDaysText}
                </span>
              </div>

              {project.deadline && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${timePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted font-semibold">
                    <span>Ngày tạo: {formatDate(project.createdAt)}</span>
                    <span>Đã qua {timePercent}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Rời dự án */}
            <button
              onClick={() => setIsLeaveConfirmOpen(true)}
              className="mt-3 w-full py-2 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              Rời dự án
            </button>
          </div>
        </div>

        {/* Card 3: Cơ cấu công việc */}
        <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
            <Layers size={18} className="text-cyan-500" />
            <span>Cơ cấu công việc</span>
          </h3>

          <div className="flex-grow flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-muted font-bold block uppercase tracking-wider">Tỷ lệ các loại task</span>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mt-2">
                {typesCount.epic > 0 && <div className="h-full bg-purple-500 transition-all" style={{ width: `${typePct(typesCount.epic)}%` }} title={`Epic: ${typesCount.epic}`} />}
                {typesCount.task > 0 && <div className="h-full bg-brand transition-all" style={{ width: `${typePct(typesCount.task)}%` }} title={`Task: ${typesCount.task}`} />}
                {typesCount.subtask > 0 && <div className="h-full bg-cyan-400 transition-all" style={{ width: `${typePct(typesCount.subtask)}%` }} title={`Subtask: ${typesCount.subtask}`} />}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2.5 bg-slate-50 border border-line/10 rounded-2xl">
                <span className="text-[10px] text-muted font-bold block uppercase">Epic</span>
                <span className="text-lg font-extrabold text-purple-600 block mt-0.5">{typesCount.epic}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-line/10 rounded-2xl">
                <span className="text-[10px] text-muted font-bold block uppercase">Task</span>
                <span className="text-lg font-extrabold text-brand block mt-0.5">{typesCount.task}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-line/10 rounded-2xl">
                <span className="text-[10px] text-muted font-bold block uppercase">Subtask</span>
                <span className="text-lg font-extrabold text-cyan-600 block mt-0.5">{typesCount.subtask}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Hàng 2: Hoạt động gần đây & Phân tải công việc */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hoạt động gần đây */}
        <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-base font-bold text-ink mb-4">Hoạt động gần đây</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-2xl transition-all">
                <Avatar src={act.user.avatar} name={act.user.name} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-relaxed">
                    <span className="font-bold">{act.user.name}</span> {act.action}{' '}
                    <span className="font-bold text-brand">{act.issueKey}</span>
                  </p>
                  {act.newValue && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <ArrowRight size={10} className="text-muted" />
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold uppercase">
                        {act.newValue}
                      </span>
                    </div>
                  )}
                  {act.comment && (
                    <p className="text-[11px] text-muted italic mt-1 bg-slate-50 p-2 rounded-xl border border-line/20">{act.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân tải công việc */}
        <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-base font-bold text-ink mb-4">Phân tải công việc</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {calculatedWorkloads.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <Avatar src={item.avatarUrl} name={item.name} size={28} />
                <div className="flex-grow space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-ink">
                    <span>{item.name}</span>
                    <span className="text-muted font-semibold">{item.percent}% ({item.count} task chưa xong)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {calculatedWorkloads.length === 0 && (
              <p className="text-xs text-subtle italic py-8 text-center">Chưa có công việc tồn đọng.</p>
            )}
          </div>
        </div>

      </div>

      {/* Hàng 3: Mức độ đóng góp của thành viên */}
      <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-ink mb-2">Đóng góp của thành viên</h3>
        <p className="text-xs text-muted font-medium mb-6">Tỷ lệ công việc đã hoàn thành (DONE) trên tổng số task được giao của từng người.</p>

        <div className="space-y-4">
          {calculatedContributions.map((member) => {
            const completionPercent = member.total ? Math.round((member.done / member.total) * 100) : 0

            return (
              <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-line/10 rounded-2xl hover:bg-slate-50/55 transition-all">
                <div className="flex items-center gap-3 w-64 shrink-0">
                  <Avatar src={member.avatarUrl} name={member.name} size={32} />
                  <div>
                    <h4 className="text-xs font-bold text-ink">{member.name}</h4>
                    <p className="text-[10px] text-muted font-semibold mt-0.5">
                      Đóng góp: <span className="font-extrabold text-emerald-600">{member.percent}%</span> tổng số DONE của dự án
                    </p>
                  </div>
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                    <span>Tiến độ cá nhân</span>
                    <span className="text-ink font-semibold">{completionPercent}% ({member.done}/{member.total} task)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
                  </div>
                </div>
              </div>
            )
          })}

          {calculatedContributions.length === 0 && (
            <p className="text-xs text-subtle italic py-6 text-center">Chưa có thành viên nào hoàn thành công việc.</p>
          )}
        </div>
      </div>

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
    </div>
  )
}

export default ProjectSummaryTab
