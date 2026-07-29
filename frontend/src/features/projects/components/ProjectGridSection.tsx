import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Project } from '../project.types'
import ProjectCard from './ProjectCard'

// Số project hiển thị mặc định mỗi mục — vừa đúng 2 hàng ở lưới 4 cột (xl), tránh danh sách
// dài đẩy các mục khác xuống quá xa khi có nhiều project.
const DEFAULT_LIMIT = 8

interface ProjectGridSectionProps {
  title: string
  projects: Project[]
  emptyText: string
  isOwner: (project: Project) => boolean
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onLeave: (project: Project) => void
  /** Số project hiển thị khi chưa mở rộng. Mặc định 8. */
  limit?: number
  /** false -> luôn cắt cứng ở `limit`, không có nút "Xem tất cả" (dùng cho mục "Gần đây"). */
  allowExpand?: boolean
}

/** 1 mục danh sách project (vd "Dự án bạn đã tạo") — tự thu gọn khi quá nhiều,
 * kèm nút "Xem tất cả / Thu gọn" ở góc dưới bên phải. */
const ProjectGridSection = ({
  title,
  projects,
  emptyText,
  isOwner,
  onEdit,
  onDelete,
  onLeave,
  limit = DEFAULT_LIMIT,
  allowExpand = true,
}: ProjectGridSectionProps) => {
  const [expanded, setExpanded] = useState(false)

  const hasMore = allowExpand && projects.length > limit
  const visibleProjects = expanded ? projects : projects.slice(0, limit)

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-ink uppercase tracking-wider border-b border-hairline pb-3">
        {title} <span className="text-subtle font-medium normal-case">({projects.length})</span>
      </h3>

      {projects.length === 0 ? (
        <p className="text-xs text-subtle italic py-1">{emptyText}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleProjects.map((project, index) => (
              <ProjectCard
                key={project._id}
                project={project}
                isOwner={isOwner(project)}
                onEdit={onEdit}
                onDelete={onDelete}
                onLeave={onLeave}
                staggerIndex={index}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-end">
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas rounded-lg transition-colors"
              >
                {expanded ? (
                  <>
                    <span>Thu gọn</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>Xem tất cả ({projects.length})</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ProjectGridSection
