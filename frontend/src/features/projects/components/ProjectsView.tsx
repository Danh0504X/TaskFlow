import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, RotateCcw } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import SearchInput from '@/components/ui/SearchInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Project } from '../project.types'
import { useProjects } from '../hooks/useProjects'
import { useDeleteProject } from '../hooks/useProjectMutations'
import ProjectCard from './ProjectCard'
import ProjectEditModal from './ProjectEditModal'

/**
 * Container quản lý màn hình danh sách Projects:
 * - Lấy danh sách (useProjects) + xử lý loading/error/empty/tìm kiếm.
 * - Điều phối modal Sửa và dialog xác nhận Xoá.
 * Tạo project mới luôn qua trình hướng dẫn (/projects/new), không dùng modal.
 */
const ProjectsView = () => {
  const navigate = useNavigate()
  const { data: projects, isLoading, isError, refetch, isFetching } = useProjects()
  const deleteMutation = useDeleteProject()

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProjects = (projects ?? []).filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.key ?? '').toLowerCase().includes(normalizedQuery),
  )

  const confirmDelete = () => {
    if (!deleting) return
    deleteMutation.mutate(deleting._id, {
      onSuccess: () => setDeleting(null),
    })
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-ink tracking-tight">Dự án</h2>
          <p className="text-muted mt-1 font-medium text-sm">
            Quản lý toàn bộ không gian dự án bạn đang tham gia.
          </p>
        </div>

        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Tạo dự án mới</span>
        </button>
      </header>

      {!isLoading && !isError && projects && projects.length > 0 && (
        <SearchInput
          containerClassName="max-w-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc mã dự án..."
        />
      )}

      {isLoading && (
        <div className="py-24 flex justify-center text-muted">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-muted font-medium">Không tải được danh sách dự án.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-line/30 rounded-xl text-xs font-bold text-muted hover:bg-slate-50 hover:text-ink transition-all"
          >
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {!isLoading && !isError && projects && (
        <>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-dashed border-line/35 rounded-3xl py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand/5 flex items-center justify-center text-brand">
                <FolderKanban size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Chưa có dự án nào</p>
                <p className="text-xs text-subtle mt-1">Bắt đầu bằng cách tạo dự án đầu tiên của bạn.</p>
              </div>
              <button
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>Tạo dự án đầu tiên</span>
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="border border-dashed border-line/35 rounded-3xl py-16 text-center text-subtle text-xs font-medium">
              Không tìm thấy dự án nào khớp với "{query}".
            </div>
          ) : (
            <>
              {isFetching && <p className="text-xs text-subtle -mt-2">Đang cập nhật...</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal Sửa */}
      <ProjectEditModal open={!!editing} onClose={() => setEditing(null)} project={editing} />

      {/* Dialog xác nhận xoá */}
      <ConfirmDialog
        open={!!deleting}
        title="Xoá project"
        message={`Bạn có chắc muốn xoá project "${deleting?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xoá"
        danger
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

export default ProjectsView
