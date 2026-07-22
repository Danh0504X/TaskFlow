import { PROJECT_STATUS, type ProjectStatus } from '../project.types'

// Map status -> màu chấm tròn + nhãn (hiện qua title khi hover). Dùng chấm tròn cố định
// kích thước thay vì pill chữ để tránh badge to nhỏ khác nhau tuỳ độ dài nhãn.
const statusConfig: Record<
  ProjectStatus,
  { dot: string; ring: string; label: string }
> = {
  [PROJECT_STATUS.ACTIVE]: { dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', label: 'Đang hoạt động' },
  [PROJECT_STATUS.COMPLETED]: { dot: 'bg-blue-500', ring: 'ring-blue-500/20', label: 'Hoàn thành' },
  [PROJECT_STATUS.CANCELLED]: { dot: 'bg-red-500', ring: 'ring-red-500/20', label: 'Đã huỷ' },
}

const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => {
  // Dữ liệu cũ có thể thiếu/không khớp enum -> fallback ACTIVE thay vì crash cả trang.
  const config = statusConfig[status] ?? statusConfig[PROJECT_STATUS.ACTIVE]
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${config.dot} ${config.ring}`}
      title={config.label}
      aria-label={config.label}
    />
  )
}

export default ProjectStatusBadge
