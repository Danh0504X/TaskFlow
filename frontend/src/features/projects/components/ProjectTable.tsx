import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import type { Project } from '../project.types'
import ProjectStatusBadge from './ProjectStatusBadge'

interface ProjectTableProps {
  projects: Project[]
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

/** Bảng danh sách project. Trình bày thuần (presentational) — nhận data & callback. */
const ProjectTable = ({ projects, onEdit, onDelete }: ProjectTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên project</th>
              <th className="px-4 py-3 font-semibold">Mô tả</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Cập nhật</th>
              <th className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link to={`/projects/${project._id}`} className="hover:text-blue-600 hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                  {project.description || '—'}
                </td>
                <td className="px-4 py-3">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(project.deadline)}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(project.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(project)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(project)}
                    >
                      Xoá
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProjectTable
