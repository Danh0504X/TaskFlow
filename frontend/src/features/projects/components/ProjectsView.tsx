import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, RotateCcw, Archive, Mail } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import PageHeaderButton from '@/components/layout/PageHeaderButton'
import Spinner from '@/components/ui/Spinner'
import SearchInput from '@/components/ui/SearchInput'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/features/auth/authStore'
import type { Project } from '../project.types'
import { useProjectInvitations, useProjects } from '../hooks/useProjects'
import { useDeleteProject, useLeaveProject, usePermanentDeleteProject } from '../hooks/useProjectMutations'
import { getRecentProjectIds } from '../recentProjects'
import ProjectGridSection from './ProjectGridSection'
import ProjectEditModal from './ProjectEditModal'
import ProjectInvitationsModal from './ProjectInvitationsModal'

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
  const { data: invitations } = useProjectInvitations()
  const deleteMutation = useDeleteProject()
  const permanentDeleteMutation = usePermanentDeleteProject()
  const leaveMutation = useLeaveProject()

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [leaving, setLeaving] = useState<Project | null>(null)
  const [showInvitations, setShowInvitations] = useState(false)

  const invitationCount = invitations?.length ?? 0

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProjects = (projects ?? []).filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.key ?? '').toLowerCase().includes(normalizedQuery),
  )

  // OWNER (đã tạo) / MEMBER (đã tham gia) xác định theo role thật trong members, không phải
  // theo createdBy — nhất quán với logic phân quyền sửa/xoá/rời dự án.
  const createdProjects = filteredProjects.filter((p) => isProjectOwner(p, currentUser?._id))
  const joinedProjects = filteredProjects.filter((p) => !isProjectOwner(p, currentUser?._id))

  // Dự án gần đây: lấy theo thứ tự vừa truy cập (localStorage, xem recentProjects.ts),
  // đối chiếu lại với danh sách project thật + đang lọc theo ô tìm kiếm.
  const recentProjects = useMemo(() => {
    if (!currentUser) return []
    const recentIds = getRecentProjectIds(currentUser._id)
    const projectById = new Map(filteredProjects.map((p) => [p._id, p]))
    return recentIds
      .map((id) => projectById.get(id))
      .filter((p): p is Project => Boolean(p))
  }, [currentUser, filteredProjects])

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
    <div className="max-w-7xl mx-auto flex flex-col">
      <PageHeader
        title="Dự án"
        subtitle="Quản lý toàn bộ không gian dự án bạn đang tham gia."
        actions={
          <>
            <PageHeaderButton icon={Mail} onClick={() => setShowInvitations(true)} badge={invitationCount}>
              Lời mời
            </PageHeaderButton>
            <PageHeaderButton icon={Archive} onClick={() => navigate('/projects/archived')}>
              Đã lưu trữ
            </PageHeaderButton>
            <PageHeaderButton icon={Plus} variant="primary" onClick={() => navigate('/projects/new')}>
              Tạo dự án mới
            </PageHeaderButton>
          </>
        }
      />

      <div className="flex flex-col gap-8 px-8 md:px-12 pt-6 pb-12">
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
          <p className="text-sm text-muted">Không tải được danh sách dự án.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-hairline rounded-lg text-xs font-semibold text-muted hover:border-ink/20 hover:text-ink transition-colors"
          >
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {!isLoading && !isError && projects && (
        <>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-dashed border-hairline rounded-xl py-24 text-center">
              <div className="w-14 h-14 rounded-lg bg-pastel-blue flex items-center justify-center text-pastel-blue-ink">
                <FolderKanban size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Chưa có dự án nào</p>
                <p className="text-xs text-subtle mt-1">Bắt đầu bằng cách tạo dự án đầu tiên của bạn.</p>
              </div>
              <button
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-semibold hover:bg-[#333333] transition-colors active:scale-[0.98]"
              >
                <Plus size={15} />
                <span>Tạo dự án đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {isFetching && <p className="text-xs text-subtle -mb-8">Đang cập nhật...</p>}

              {recentProjects.length > 0 && (
                <ProjectGridSection
                  title="Dự án gần đây"
                  projects={recentProjects}
                  emptyText="Chưa có dự án nào được truy cập gần đây."
                  isOwner={(project) => isProjectOwner(project, currentUser?._id)}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onLeave={setLeaving}
                  limit={4}
                  allowExpand={false}
                />
              )}

              <ProjectGridSection
                title="Dự án bạn đã tạo"
                projects={createdProjects}
                emptyText="Bạn chưa tự tạo dự án nào."
                isOwner={(project) => isProjectOwner(project, currentUser?._id)}
                onEdit={setEditing}
                onDelete={setDeleting}
                onLeave={setLeaving}
                limit={4}
              />

              <ProjectGridSection
                title="Tất cả dự án bạn đã tham gia"
                projects={joinedProjects}
                emptyText="Bạn chưa tham gia dự án nào khác."
                isOwner={(project) => isProjectOwner(project, currentUser?._id)}
                onEdit={setEditing}
                onDelete={setDeleting}
                onLeave={setLeaving}
              />
            </div>
          )}
        </>
      )}
      </div>

      {/* Modal danh sách lời mời tham gia dự án đang chờ xử lý */}
      <ProjectInvitationsModal open={showInvitations} onClose={() => setShowInvitations(false)} />

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
