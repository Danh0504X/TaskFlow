import { Link } from 'react-router-dom'
import { Calendar, Pencil, Trash2, Users } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { Project } from '../project.types'
import ProjectStatusBadge from './ProjectStatusBadge'
import ProjectMethodologyBadge from './ProjectMethodologyBadge'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

/** Thẻ hiển thị 1 project trong lưới danh sách — trình bày thuần, nhận data & callback. */
const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  return (
    <div className="group bg-white border border-line/30 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-brand/30 transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-brand/5 border border-brand/10 text-brand rounded text-[10px] font-extrabold uppercase tracking-wider">
              {project.key || '—'}
            </span>
            <ProjectMethodologyBadge methodology={project.methodology} />
          </div>
          <Link
            to={`/projects/${project._id}`}
            className="text-base font-extrabold text-ink tracking-tight hover:text-brand transition-colors line-clamp-1"
          >
            {project.name}
          </Link>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="text-xs text-muted font-medium leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {project.description || 'Chưa có mô tả cho dự án này.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-line/10">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(project.deadline)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} />
            {project.members.length}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 text-muted hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
            aria-label="Sửa project"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            aria-label="Xoá project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
