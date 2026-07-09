import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Project } from '../project.types'
import { useProjects } from '../hooks/useProjects'
import { useDeleteProject } from '../hooks/useProjectMutations'
import ProjectTable from './ProjectTable'
import ProjectFormModal from './ProjectFormModal'

/**
 * Container quản lý toàn bộ màn hình Projects:
 * - Lấy danh sách (useProjects) + xử lý loading/error/empty.
 * - Điều phối modal Thêm/Sửa và dialog xác nhận Xoá.
 * Đây là "khuôn mẫu" để team copy cho các domain khác (sprints, issues...).
 */
const ProjectsView = () => {
  const navigate = useNavigate()
  const { data: projects, isLoading, isError, refetch, isFetching } = useProjects()
  const deleteMutation = useDeleteProject()

  // State cho modal form (Thêm/Sửa) và dialog xoá.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditing(project)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteMutation.mutate(deleting._id, {
      onSuccess: () => setDeleting(null),
    })
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500">
            Quản lý các project của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/projects/new')}>
            Trình hướng dẫn
          </Button>
          <Button onClick={openCreate}>+ Tạo project</Button>
        </div>
      </div>

      {/* Trạng thái tải */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-500">
          <Spinner /> Đang tải danh sách...
        </div>
      )}

      {/* Trạng thái lỗi */}
      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 py-16 text-red-700">
          <p>Không tải được danh sách project.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Có dữ liệu */}
      {!isLoading && !isError && projects && (
        <>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-500">
              <p>Chưa có project nào.</p>
              <Button onClick={openCreate}>Tạo project đầu tiên</Button>
            </div>
          ) : (
            <>
              {/* Cờ refetch ngầm (vd sau khi tạo/sửa) — phản hồi tinh tế. */}
              {isFetching && (
                <p className="mb-2 text-xs text-slate-400">Đang cập nhật...</p>
              )}
              <ProjectTable
                projects={projects}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            </>
          )}
        </>
      )}

      {/* Modal Thêm/Sửa */}
      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editing}
      />

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
    </section>
  )
}

export default ProjectsView
