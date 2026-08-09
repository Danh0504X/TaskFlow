import { useState } from 'react'
import { Check, ChevronDown, FolderGit2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import Spinner from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/authStore'
import { useProjects } from '@/features/projects/hooks/useProjects'

interface ProjectPickerProps {
  value: string | null
  onChange: (projectId: string) => void
}

/** Chỉ liệt kê dự án mà user hiện tại là OWNER (chủ dự án — vai trò duy nhất có toàn quyền
 * quản trị project, tương đương "PM" trong tài liệu thiết kế; xem authorizeProjectRole('OWNER')
 * ở backend). Lọc phía client từ danh sách project đã có, không cần endpoint riêng.
 *
 * Trigger gọn 1 dòng + dropdown lưới card khi mở — tự chứa (component không cần AiLabPage biết
 * gì thêm về danh sách project), giữ khu vực "chọn dự án" cố định gọn ở đầu trang, không chiếm
 * chỗ cuộn như khi lưới luôn mở. */
const ProjectPicker = ({ value, onChange }: ProjectPickerProps) => {
  const [open, setOpen] = useState(false)
  const currentUserId = useAuthStore((state) => state.user?._id)
  const { data: projects, isLoading, isError } = useProjects()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-subtle">
        <Spinner /> Đang tải danh sách dự án...
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-pastel-red-ink">Không tải được danh sách dự án.</p>
  }

  const ownedProjects = (projects ?? []).filter((project) =>
    project.members.some(
      (member) => member.userId === currentUserId && member.role === 'OWNER' && member.status === 'ACTIVE',
    ),
  )

  if (ownedProjects.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-6 text-center">
        <FolderGit2 className="mx-auto mb-2 text-subtle" size={28} />
        <p className="text-sm font-semibold text-ink">Bạn chưa là chủ dự án nào</p>
        <p className="mt-1 text-xs text-subtle">
          AI Lab chỉ dành cho chủ dự án (OWNER) — hãy tạo 1 dự án mới hoặc dùng dự án bạn đang sở hữu.
        </p>
      </div>
    )
  }

  const selectedProject = ownedProjects.find((project) => project._id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-hairline bg-surface p-2.5 text-left transition-colors hover:border-ink/20 sm:w-auto sm:min-w-[220px]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/10 bg-brand/8 text-[10px] font-extrabold text-brand">
          {selectedProject ? (selectedProject.key || selectedProject.name).slice(0, 2).toUpperCase() : '—'}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-subtle">Dự án</span>
          <p className="truncate text-xs font-semibold text-ink">{selectedProject?.name ?? 'Chọn dự án'}</p>
        </div>
        <ChevronDown size={14} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 grid w-full grid-cols-1 gap-2 rounded-lg border border-hairline bg-surface p-2 shadow-lg sm:w-[420px] sm:grid-cols-2">
            {ownedProjects.map((project) => {
              const isSelected = project._id === value
              return (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => {
                    onChange(project._id)
                    setOpen(false)
                  }}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                    isSelected ? 'border-ink bg-canvas ring-1 ring-ink/10' : 'border-hairline bg-surface hover:border-ink/20',
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/10 bg-brand/8 text-[10px] font-extrabold text-brand">
                    {(project.key || project.name).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{project.name}</p>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-subtle">
                      {project.key || '—'}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 text-ink" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectPicker
