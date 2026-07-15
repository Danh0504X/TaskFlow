import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, SlidersHorizontal, AlertTriangle, Clock, Sparkles, ListChecks, Activity, CheckCircle2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDashboardOverview } from '../hooks/useDashboard'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading } = useDashboardOverview()
  const [aiHelperOpen, setAiHelperOpen] = useState(false)

  const firstName = user?.fullName?.split(' ').at(-1) ?? user?.fullName ?? ''

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const { stats, assignedTasks, upcomingEvents } = data

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-ink tracking-tight">Chào mừng trở lại{firstName ? `, ${firstName}` : ''}!</h2>
          <p className="text-muted mt-1 font-medium">
            Hôm nay bạn có <span className="text-brand font-bold">{stats.todo + stats.inProgress} công việc</span> cần tập trung.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-line/40 rounded-xl text-sm font-semibold text-muted hover:bg-slate-50 transition-all">
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
          </button>
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-line/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5 min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted tracking-wider uppercase">Cần thực hiện</span>
            <div className="w-9 h-9 rounded-xl bg-brand/8 flex items-center justify-center text-brand shrink-0">
              <ListChecks size={16} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-brand leading-none">{stats.todo}</span>
        </div>

        <div className="bg-white border border-line/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5 min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted tracking-wider uppercase">Đang tiến hành</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Activity size={16} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-ink leading-none">{stats.inProgress}</span>
        </div>

        <div className="bg-white border border-line/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5 min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted tracking-wider uppercase">Đã hoàn thành</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-600 leading-none">{stats.completedThisMonth}</span>
            <span className="text-[10px] font-bold text-muted">Tháng này</span>
          </div>
        </div>

        <div className="bg-white border border-line/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5 min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted tracking-wider uppercase">Quá hạn</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle size={16} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-red-600 leading-none">{stats.overdue}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white border border-line/20 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-ink">Công việc được giao</h3>
            <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              <span>Xem tất cả</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {assignedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-line/10 rounded-2xl transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-ink leading-snug truncate">{task.summary}</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Dự án: <span className="font-semibold">{task.projectName}</span> • {task.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {task.assigneeAvatars.length > 0 && (
                    <div className="flex -space-x-2">
                      {task.assigneeAvatars.map((url) => (
                        <img key={url} src={url} alt="Assignee" className="w-6 h-6 rounded-full border border-white object-cover" />
                      ))}
                    </div>
                  )}
                  <IssuePriorityBadge priority={task.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-line/20 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-ink mb-6">Sắp tới</h3>
          <div className="space-y-4 flex-grow">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex gap-4 p-4 border border-line/15 rounded-2xl bg-white hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand/5 flex flex-col items-center justify-center border border-brand/10 text-brand shrink-0">
                  <span className="text-lg font-extrabold leading-none">{event.day}</span>
                  <span className="text-[9px] font-bold tracking-wider mt-0.5">{event.month}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-ink truncate">{event.title}</h4>
                  <p className="text-[11px] text-muted mt-1 font-medium">
                    {event.time} • {event.platform}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 right-8 z-50">
        {aiHelperOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white border border-brand/20 shadow-2xl rounded-2xl p-5 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line/20">
              <Sparkles className="text-brand" size={16} />
              <h4 className="font-bold text-xs text-brand uppercase tracking-wider">Trợ lý TaskFlow AI</h4>
            </div>
            <p className="text-xs text-ink leading-relaxed">
              Xin chào! Bạn có {stats.overdue > 0 ? `${stats.overdue} công việc quá hạn` : 'các công việc đang chờ'} cần xử lý. Bạn có muốn tôi giúp phân tích rủi ro tiến độ không?
            </p>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-1.5 bg-brand text-white rounded-lg text-[11px] font-bold hover:bg-brand-light transition-all">
                Phân tích ngay
              </button>
              <button
                onClick={() => setAiHelperOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-muted rounded-lg text-[11px] font-medium transition-all"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setAiHelperOpen(!aiHelperOpen)}
          className="w-14 h-14 bg-brand text-white rounded-full shadow-lg shadow-brand/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <Sparkles className="group-hover:rotate-12 transition-transform" size={24} />
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
