import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RotateCcw, Trash2, FolderKanban, ShieldAlert } from 'lucide-react'
import { projectApi } from '../project.api'
import { useRestoreProject, usePermanentDeleteProject } from '../hooks/useProjectMutations'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import ProjectMethodologyBadge from '../components/ProjectMethodologyBadge'

const ArchivedProjectsPage = () => {
  const navigate = useNavigate()
  const restoreMutation = useRestoreProject()
  const permanentDeleteMutation = usePermanentDeleteProject()

  const [confirmDeletingId, setConfirmDeletingId] = useState<string | null>(null)

  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ['archived-projects'],
    queryFn: projectApi.getArchivedProjects,
  })

  const handleRestore = (projectId: string) => {
    restoreMutation.mutate(projectId)
  }

  const handlePermanentDelete = () => {
    if (!confirmDeletingId) return
    permanentDeleteMutation.mutate(confirmDeletingId, {
      onSuccess: () => setConfirmDeletingId(null),
    })
  }

  const isMutating = restoreMutation.isPending || permanentDeleteMutation.isPending

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 p-8">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 text-muted hover:text-ink hover:bg-slate-100 rounded-xl transition-all"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-ink tracking-tight">Dự án đã lưu trữ</h2>
          <p className="text-muted mt-1 font-medium text-sm">
            Danh sách các dự án không hoạt động. Bạn có thể khôi phục lại hoặc xóa vĩnh viễn.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="py-24 flex justify-center text-muted">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-muted font-medium">Không tải được danh sách dự án lưu trữ.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && projects && (
        <>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-dashed border-line/35 rounded-3xl py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-line/10 flex items-center justify-center text-muted">
                <FolderKanban size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Thư mục lưu trữ trống</p>
                <p className="text-xs text-subtle mt-1">Chưa có dự án nào được lưu trữ tại đây.</p>
              </div>
            </div>
          ) : (
            <div className="border border-line/15 rounded-3xl bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line/15 bg-slate-50/50 text-[10px] font-extrabold text-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Dự án</th>
                      <th className="px-6 py-4">Mã</th>
                      <th className="px-6 py-4">Quy trình</th>
                      <th className="px-6 py-4">Mô tả</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/10">
                    {projects.map((project) => (
                      <tr
                        key={project._id}
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-line/20 flex items-center justify-center text-muted font-bold text-xs shrink-0">
                              {(project.key || project.name).slice(0, 2).toUpperCase()}
                            </div>
                            <button
                              onClick={() => navigate(`/projects/${project._id}`)}
                              className="text-sm font-bold text-ink hover:text-brand hover:underline text-left outline-none"
                            >
                              {project.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-muted bg-slate-100 px-2 py-1 rounded-md">
                            {project.key}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <ProjectMethodologyBadge methodology={project.methodology} />
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-xs text-muted">
                          {project.description || <span className="italic text-subtle">Không có mô tả</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRestore(project._id)}
                              disabled={isMutating}
                              className="h-[30px]"
                            >
                              <RotateCcw size={12} />
                              <span>Khôi phục</span>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmDeletingId(project._id)}
                              disabled={isMutating}
                              className="h-[30px]"
                            >
                              <Trash2 size={12} />
                              <span>Xóa vĩnh viễn</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal xác nhận xóa vĩnh viễn trong trang Lưu trữ */}
      <Modal
        open={!!confirmDeletingId}
        onClose={() => setConfirmDeletingId(null)}
        title="Xóa vĩnh viễn dự án"
        tone="danger"
        layout="compact"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmDeletingId(null)}
              disabled={permanentDeleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handlePermanentDelete}
              loading={permanentDeleteMutation.isPending}
            >
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">Bạn có chắc chắn muốn xóa vĩnh viễn?</p>
            <p className="text-xs text-muted leading-relaxed">
              Hành động này sẽ xóa hoàn toàn dự án và tất cả các thông tin, task liên quan. Không thể khôi phục lại dữ liệu này sau khi xóa.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ArchivedProjectsPage
