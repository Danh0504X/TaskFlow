import { ArrowRight } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'

interface ProjectSummaryTabProps {
  projectId: string
}

// Hoạt động gần đây & phân tải công việc CHƯA có backend (activity log, workload) -> giữ mock tĩnh.
// TODO: thay bằng API thật khi backend có endpoint activity/workload.
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

const workloads = [
  { name: 'Chưa phân công', percent: 25 },
  { name: 'Alex Chen', percent: 85 },
  { name: 'Sarah Miller', percent: 60 },
  { name: 'James Wilson', percent: 40 },
]

const ProjectSummaryTab = ({ projectId }: ProjectSummaryTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)

  if (isLoading || !issues) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const total = issues.length || 1
  const stats = {
    total: issues.length,
    todo: issues.filter((i) => i.status === 'TODO').length,
    inProgress: issues.filter((i) => i.status === 'IN_PROGRESS').length,
    inReview: issues.filter((i) => i.status === 'IN_REVIEW').length,
    done: issues.filter((i) => i.status === 'DONE').length,
  }
  const pct = (n: number) => Math.round((n / total) * 100)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-base font-bold text-ink mb-6">Trạng thái công việc</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 flex-grow">
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#6b38d4" strokeDasharray={`${pct(stats.todo)}, 100`} strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#8b5cf6" strokeDasharray={`${pct(stats.inReview)}, 100`} strokeDashoffset={-pct(stats.todo)} strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#06b6d4" strokeDasharray={`${pct(stats.inProgress)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview))} strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="18" cy="18" fill="none" r="15.9155" stroke="#10b981" strokeDasharray={`${pct(stats.done)}, 100`} strokeDashoffset={-(pct(stats.todo) + pct(stats.inReview) + pct(stats.inProgress))} strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-ink leading-none">{stats.total}</span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1">Tổng cộng</span>
            </div>
          </div>

          <div className="flex-grow w-full space-y-2.5">
            {[
              { label: 'Cần thực hiện', value: stats.todo, color: 'bg-brand' },
              { label: 'Đang đánh giá', value: stats.inReview, color: 'bg-brand-glow' },
              { label: 'Đang làm', value: stats.inProgress, color: 'bg-cyan-500' },
              { label: 'Đã xong', value: stats.done, color: 'bg-emerald-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${row.color}`} />
                  <span className="text-muted">{row.label}</span>
                </div>
                <span className="text-ink font-bold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
        <h3 className="text-base font-bold text-ink mb-6">Phân tải công việc</h3>
        <div className="space-y-4">
          {workloads.map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-ink">
                <span>{item.name}</span>
                <span className="text-muted font-semibold">{item.percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-brand" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProjectSummaryTab
