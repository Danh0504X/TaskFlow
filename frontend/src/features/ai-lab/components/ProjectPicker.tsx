import { ChevronDown, FolderGit2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/authStore'
import { useProjects } from '@/features/projects/hooks/useProjects'

interface ProjectPickerProps {
  value: string | null
  onChange: (projectId: string) => void
}

/** Chỉ liệt kê dự án mà user hiện tại là OWNER (chủ dự án — vai trò duy nhất có toàn quyền
 * quản trị project, tương đương "PM" trong tài liệu thiết kế; xem authorizeProjectRole('OWNER')
 * ở backend). Lọc phía client từ danh sách project đã có, không cần endpoint riêng. */
const ProjectPicker = ({ value, onChange }: ProjectPickerProps) => {
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

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-ink">Dự án</label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-hairline bg-surface px-4 py-3 text-sm font-medium text-ink outline-none transition-all focus:ring-2 focus:ring-brand/15"
        >
          <option value="" disabled>
            -- Chọn dự án --
          </option>
          {ownedProjects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.key} · {project.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
      </div>
    </div>
  )
}

export default ProjectPicker
