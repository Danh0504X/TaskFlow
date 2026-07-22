import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, RotateCcw, Archive } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import SearchInput from '@/components/ui/SearchInput'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/features/auth/authStore'
import type { Project } from '../project.types'
import { useProjects } from '../hooks/useProjects'
import { useDeleteProject, useLeaveProject, usePermanentDeleteProject } from '../hooks/useProjectMutations'
import ProjectCard from './ProjectCard'
import ProjectEditModal from './ProjectEditModal'

/** Owner là member có role OWNER trong project — chỉ owner được sửa/lưu trữ/xoá dự án. */
const isProjectOwner = (project: Project, currentUserId?: string) =>
  project.members.some((member) => member.userId === currentUserId && member.role === 'OWNER')

/**
 * Container quản lý màn hình danh sách Projects:
 * - Lấy danh sách (useProjects) + xử lý loading/error/empty/tìm kiếm.
 * - Điều phối modal Sửa và dialog xác nhận Xoá.
 * Tạo project mới luôn qua trình hướng dẫn (/projects/new), không dùng modal.
 */
const ProjectsView = () => {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const { data: projects, isLoading, isError, refetch, isFetching } = useProjects()
  const deleteMutation = useDeleteProject()
  const permanentDeleteMutation = usePermanentDeleteProject()
  const leaveMutation = useLeaveProject()

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [leaving, setLeaving] = useState<Project | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProjects = (projects ?? []).filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.key ?? '').toLowerCase().includes(normalizedQuery),
  )

  const createdProjects = filteredProjects.filter((p) => p.createdBy === currentUser?._id)
  const joinedProjects = filteredProjects.filter((p) => p.createdBy !== currentUser?._id)

  const handleArchive = () => {
    if (!deleting) return
    deleteMutation.mutate(deleting._id, {
      onSuccess: () => setDeleting(null),
    })
  }

  const handlePermanentDelete = () => {
    if (!deleting) return
    permanentDeleteMutation.mutate(deleting._id, {
      onSuccess: () => setDeleting(null),
    })
  }

  const handleLeave = () => {
    if (!leaving) return
    leaveMutation.mutate(leaving._id, {
      onSuccess: () => setLeaving(null),
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

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/projects/archived')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-ink border border-line/30 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            <Archive size={16} className="text-muted" />
            <span>Dự án đã lưu trữ</span>
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
          ) : (
            <div className="space-y-10">
              {isFetching && <p className="text-xs text-subtle -mb-4">Đang cập nhật...</p>}
              
              {/* Dự án bạn đã tạo */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider border-b border-line/10 pb-2">
                  Dự án bạn đã tạo ({createdProjects.length})
                </h3>
                {createdProjects.length === 0 ? (
                  <p className="text-xs text-subtle italic py-1">Bạn chưa tự tạo dự án nào.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdProjects.map((project) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        isOwner={isProjectOwner(project, currentUser?._id)}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                        onLeave={setLeaving}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Dự án bạn đã tham gia */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider border-b border-line/10 pb-2">
                  Tất cả dự án bạn đã tham gia ({joinedProjects.length})
                </h3>
                {joinedProjects.length === 0 ? (
                  <p className="text-xs text-subtle italic py-1">Bạn chưa tham gia dự án nào khác.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedProjects.map((project) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        isOwner={isProjectOwner(project, currentUser?._id)}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                        onLeave={setLeaving}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Sửa */}
      <ProjectEditModal open={!!editing} onClose={() => setEditing(null)} project={editing} />

      {/* Modal xác nhận lưu trữ hoặc xoá vĩnh viễn */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xử lý dự án"
        tone="danger"
        layout="compact"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={deleteMutation.isPending || permanentDeleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleArchive}
              loading={deleteMutation.isPending}
              disabled={permanentDeleteMutation.isPending}
            >
              Lưu trữ
            </Button>
            <Button
              variant="danger"
              onClick={handlePermanentDelete}
              loading={permanentDeleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-ink font-semibold">
            Bạn muốn xử lý dự án "{deleting?.name}" như thế nào?
          </p>
          <ul className="text-xs text-muted list-disc list-inside space-y-1.5 leading-relaxed">
            <li><strong>Lưu trữ dự án:</strong> Dự án sẽ được chuyển vào mục lưu trữ tạm thời và có thể khôi phục lại sau này.</li>
            <li><strong>Xóa vĩnh viễn:</strong> Dự án và mọi dữ liệu liên quan sẽ bị xóa hoàn toàn, không thể hoàn tác.</li>
          </ul>
        </div>
      </Modal>

      {/* Modal xác nhận rời dự án (dành cho MEMBER, không có quyền lưu trữ/xoá) */}
      <ConfirmDialog
        open={!!leaving}
        title="Rời khỏi dự án"
        message={`Bạn có chắc chắn muốn rời khỏi dự án "${leaving?.name}"? Sau khi rời đi, tất cả các công việc đang được gán cho bạn sẽ được chuyển về trạng thái 'Chưa phân công'.`}
        confirmText="Rời dự án"
        danger
        loading={leaveMutation.isPending}
        onConfirm={handleLeave}
        onClose={() => setLeaving(null)}
      />
    </div>
  )
}

export default ProjectsView
