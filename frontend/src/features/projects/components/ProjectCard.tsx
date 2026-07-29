import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, LogOut, Pencil, Trash2, Users } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { Project } from '../project.types'
import ProjectStatusBadge from './ProjectStatusBadge'
import ProjectMethodologyBadge from './ProjectMethodologyBadge'

interface ProjectCardProps {
  project: Project
  /** Chỉ OWNER mới được sửa/lưu trữ/xoá; MEMBER chỉ có thể rời dự án. */
  isOwner: boolean
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onLeave: (project: Project) => void
  /** Thứ tự trong lưới — dùng để so le hiệu ứng xuất hiện (animate-fade-up). */
  staggerIndex?: number
}

/** Thẻ hiển thị 1 project trong lưới danh sách — trình bày thuần, nhận data & callback. */
const ProjectCard = ({ project, isOwner, onEdit, onDelete, onLeave, staggerIndex = 0 }: ProjectCardProps) => {
  return (
    <div
      className="group animate-fade-up bg-white border border-hairline rounded-lg p-4 hover:border-ink/15 transition-colors flex flex-col gap-3"
      style={{ '--stagger': staggerIndex } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand/8 border border-brand/10 flex items-center justify-center text-brand font-extrabold text-xs shrink-0">
            {(project.key || project.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              to={`/projects/${project._id}`}
              className="text-sm font-semibold text-ink tracking-tight hover:text-brand transition-colors line-clamp-1"
            >
              {project.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-semibold text-subtle uppercase tracking-wider">{project.key || '—'}</span>
              <ProjectMethodologyBadge methodology={project.methodology} />
            </div>
          </div>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="text-[11px] text-muted leading-relaxed line-clamp-1">
        {project.description || 'Chưa có mô tả cho dự án này.'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-hairline">
        <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(project.deadline)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {project.members.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOwner ? (
            <>
              <button
                onClick={() => onEdit(project)}
                className="p-1.5 text-muted hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors"
                aria-label="Sửa project"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(project)}
                className="p-1.5 text-muted hover:text-pastel-red-ink hover:bg-pastel-red rounded-md transition-colors"
                aria-label="Xoá project"
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={() => onLeave(project)}
              className="p-1.5 text-muted hover:text-pastel-red-ink hover:bg-pastel-red rounded-md transition-colors"
              aria-label="Rời dự án"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
