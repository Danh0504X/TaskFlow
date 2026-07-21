import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import IssueDetailPanel from '@/features/issues/components/IssueDetailPanel'
import { useMyTasks } from '../hooks/useMyTasks'
import type { IssueStatus } from '@/features/issues/issue.types'

type FilterTab = 'ALL' | IssueStatus

const filterItems: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'Tất cả việc' },
  { value: 'TODO', label: 'Cần làm' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'DONE', label: 'Đã hoàn thành' },
]

const MyTasksPage = () => {
  const { data: tasks, isLoading } = useMyTasks()
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null)

  const filteredTasks = (tasks ?? []).filter((task) => {
    if (activeTab !== 'ALL' && task.status !== activeTab) return false
    return (
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const selectedTask = tasks?.find((task) => task.key === selectedTaskKey) ?? null

  const assignedCount = tasks?.length ?? 0
  const inProgressCount = tasks?.filter((t) => t.status === 'IN_PROGRESS').length ?? 0

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-brand tracking-tight mb-2">Công việc của tôi</h2>
          <p className="text-muted font-medium max-w-xl text-sm leading-relaxed">
            Theo dõi, thực hiện và cập nhật trạng thái mọi đầu việc được phân công cho bạn từ tất cả các dự án.
          </p>
        </div>

        <div className="flex gap-4 p-4 bg-slate-50 border border-line/15 rounded-2xl">
          <div className="text-center px-4 border-r border-line/20">
            <span className="text-2xl font-extrabold text-brand">{assignedCount}</span>
            <p className="text-[9px] font-bold text-muted uppercase mt-1">Được giao</p>
          </div>
          <div className="text-center px-4">
            <span className="text-2xl font-extrabold text-amber-600">{inProgressCount}</span>
            <p className="text-[9px] font-bold text-muted uppercase mt-1">Đang thực hiện</p>
          </div>
        </div>
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

        <Tabs items={filterItems} value={activeTab} onChange={setActiveTab} />
      </section>

      <section className="space-y-3.5">
        {isLoading && (
          <div className="py-12 flex justify-center text-muted">
            <Spinner />
          </div>
        )}

        {!isLoading &&
          filteredTasks.map((task) => (
            <div
              key={task._id}
              onClick={() => setSelectedTaskKey(task.key)}
              className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white hover:bg-slate-50/50 border border-line/15 rounded-2xl hover:border-brand/30 transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand/5 flex items-center justify-center shrink-0">
                  <IssueTypeIcon type={task.type} size={16} />
                </div>
                <span className="text-xs font-bold text-brand flex-shrink-0">{task.key}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-ink truncate max-w-md">{task.title}</h4>
                  <p className="text-[10px] text-muted font-semibold mt-1">
                    Dự án: <span className="font-bold">{task.projectName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <IssuePriorityBadge priority={task.priority} showIcon={false} />
                <IssueStatusBadge status={task.status} />
              </div>
            </div>
          ))}

        {!isLoading && filteredTasks.length === 0 && (
          <div className="border border-dashed border-line/35 rounded-3xl py-12 text-center text-subtle text-xs font-medium">
            Không tìm thấy công việc nào khớp với điều kiện tìm kiếm.
          </div>
        )}
      </section>

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